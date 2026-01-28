import { defineStore } from 'pinia';
import questionsData from '../../public/data/questions.json';

export const useQuizStore = defineStore('quiz', {
    state: () => ({
        questions: [],
        userAnswers: {}, // Format: { questionId: ["A"] }
        currentPage: 1,
        pageSize: 10,
        pageValidated: false, // Tracks if user clicked "Check Answers" for current page
        validationResults: {} // Computed or stored? Let's compute on fly or store simple flags.
    }),

    actions: {
        loadQuestions() {
            // In a real app we might fetch this. Here we import directly or fetch from public/data
            // Since we imported it, we can just assign.
            // However, `import questionsData` in Vite works for JSON.
            // Note: questionsData.questions is the array.
            this.questions = questionsData.questions;
        },

        selectOption(questionId, option, type) {
            if (this.pageValidated) return; // Prevent changing answers after validation? Or allow but reset validation?
            // Let's allow changing but reset validation if we want strictness. 
            // PRD says: "Allow users to revise answers before moving forward" -> implies after check?
            // "Allow users to revise answers before moving forward" usually implies *after* checking, they can fix it?
            // If they fix it, do we re-validate immediately? Or hide results?
            // Simple UX: If page is validated, and user changes answer, turn off validation view for that question or whole page.

            this.pageValidated = false;

            if (type === 'single') {
                this.userAnswers[questionId] = [option];
            } else {
                // Multiple
                const current = this.userAnswers[questionId] || [];
                if (current.includes(option)) {
                    this.userAnswers[questionId] = current.filter(o => o !== option);
                } else {
                    this.userAnswers[questionId] = [...current, option];
                }
            }
        },

        toggleValidation() {
            this.pageValidated = !this.pageValidated;
        },

        setPage(page) {
            this.currentPage = page;
            this.pageValidated = false; // Reset validation view on page change
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    getters: {
        currentQuestions(state) {
            const start = (state.currentPage - 1) * state.pageSize;
            return state.questions.slice(start, start + state.pageSize);
        },
        totalPages(state) {
            return Math.ceil(state.questions.length / state.pageSize);
        },
        // Calculate score for current page
        currentPageScore(state) {
            const currentQs = this.currentQuestions;
            let correct = 0;
            let total = currentQs.length;

            currentQs.forEach(q => {
                const userAns = state.userAnswers[q.id] || [];
                const correctAns = q.correctAnswers || [];

                // Compare arrays
                const isCorrect = userAns.length === correctAns.length &&
                    userAns.every(val => correctAns.includes(val));
                if (isCorrect) correct++;
            });

            return { correct, total, incorrect: total - correct };
        }
    }
});
