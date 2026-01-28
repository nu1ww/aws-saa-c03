<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-500">Loading Exam Questions...</p>
    </div>

    <div v-else>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">AWS SAA-C03 Practice</h1>
        <div class="flex items-center space-x-2 text-sm">
             <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">Exam Mode</span>
        </div>
      </div>

      <!-- Score Card (only visible if validated) -->
      <div v-if="store.pageValidated" class="bg-gray-900 text-white rounded-lg p-4 mb-6 flex justify-between items-center shadow-lg transform transition-all">
        <div>
          <h3 class="font-bold text-lg">Page Results</h3>
          <p class="text-gray-300 text-sm">Review your answers before moving on.</p>
        </div>
        <div class="flex space-x-6 text-center">
          <div>
            <span class="block text-2xl font-bold text-green-400">{{ store.currentPageScore.correct }}</span>
            <span class="text-xs uppercase tracking-wider text-gray-400">Correct</span>
          </div>
          <div>
            <span class="block text-2xl font-bold text-red-400">{{ store.currentPageScore.incorrect }}</span>
            <span class="text-xs uppercase tracking-wider text-gray-400">Incorrect</span>
          </div>
        </div>
      </div>

      <!-- Questions List -->
      <div class="space-y-6">
        <QuestionCard 
          v-for="q in store.currentQuestions" 
          :key="q.id" 
          :question="q" 
        />
      </div>

      <!-- Action Bar -->
      <div class="mt-8 flex justify-end">
        <button 
          v-if="!store.pageValidated"
          @click="store.toggleValidation()"
          class="flex items-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-transform active:scale-95"
        >
          Check Answers
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
        <button 
          v-else
          @click="store.toggleValidation()"
          class="flex items-center px-6 py-3 bg-gray-600 text-white font-bold rounded-lg shadow hover:bg-gray-700"
        >
          Hide Answers
        </button>
      </div>

      <!-- Pagination -->
      <Pagination 
        :current="store.currentPage" 
        :total="store.totalPages" 
        @prev="store.setPage(store.currentPage - 1)" 
        @next="store.setPage(store.currentPage + 1)"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useQuizStore } from '../../stores/quizStore';
import QuestionCard from './QuestionCard.vue';
import Pagination from '../UI/Pagination.vue';

const store = useQuizStore();
const loading = ref(true);

onMounted(() => {
  store.loadQuestions();
  loading.value = false;
});
</script>
