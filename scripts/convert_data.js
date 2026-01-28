import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const PDF_PATH = 'AWS Certified Solutions Architect Associate SAA-C03.pdf';
const TXT_PATH = 'AWS SAA-03 Solution.txt';
// Use absolute path or relative to CWD. Since CWD is root, this is fine.
const OUTPUT_PATH = 'public/data/questions.json';

const parseAnswers = (txtContent) => {
    const answers = {};
    const textAnswers = {}; // Store text for fuzzy matching

    const lines = txtContent.split(/\r?\n/);
    let currentId = null;

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        // Match "1] ..." or "105] ..." start
        const idMatch = line.match(/^(\d+)]/);
        if (idMatch) {
            currentId = parseInt(idMatch[1]);
            if (!answers[currentId]) {
                answers[currentId] = new Set();
            }
        }

        if (currentId) {
            // Strategy 1: "Correct answer A" or "Correct Answer: A"
            const correctMatch = line.match(/Correct answer[:\s-]*([A-E]+)/i);
            if (correctMatch) {
                correctMatch[1].toUpperCase().split('').forEach(l => answers[currentId].add(l));
            }

            // Strategy 2: "Option A"
            const optionMatch = line.match(/Option\s+([A-E])/i);
            if (optionMatch) {
                answers[currentId].add(optionMatch[1].toUpperCase());
            }

            // Strategy 3: Lines starting with "A. " or "A " found alone
            // In the solution file, often the answer line is just "A. Some text"
            // We need to be careful not to match questions text that starts with "A." (rare but possible)
            // But usually, the lines in solution text are:
            // "59: B Create..."
            // So we look for Start of line -> Letter -> Dot/Space
            const singleLineMatch = line.match(/^([A-E])[\.\s]\s+/);
            if (singleLineMatch) {
                // We add this. If it turns out to be false positive, we might have too many answers?
                // Given the file structure, this is highly likely the answer.
                answers[currentId].add(singleLineMatch[1].toUpperCase());
            }

            // Strategy 4: "ans- A" or "ans-A" (Letter)
            const ansMatch = line.match(/^ans\s*[-:]\s*([A-E]+)(?:\s|$)/i);
            if (ansMatch) {
                ansMatch[1].toUpperCase().split('').forEach(l => answers[currentId].add(l));
            } else {
                // Strategy 5: "ans- Some Text" (Text)
                // Capture text if it starts with "ans-" but NOT followed by just a letter
                const textMatch = line.match(/^ans\s*[-:.]\s*(.+)/i);
                if (textMatch) {
                    // Check if it's not jsut a letter
                    const content = textMatch[1].trim();
                    if (content.length > 2) {
                        // e.g. "Use Amazon Athena..."
                        if (!textAnswers[currentId]) textAnswers[currentId] = [];
                        textAnswers[currentId].push(content);
                    }
                }
            }

            // Strategy 5: "ans-. Add..." -> Typos like Q3
            // if (line.match(/^ans-\.\s*([A-E]?)/i)) {
            //     // Fuzzy match first word? Q3 is "Add". A starts with "Add".
            //     // This is getting complex. Let's rely on Strategies 1-3 mostly.
            // }
        }
    });

    // Convert Sets to Arrays
    const finalAnswers = {};
    Object.keys(answers).forEach(k => {
        const arr = Array.from(answers[k]).sort();
        if (arr.length > 0) {
            finalAnswers[k] = arr;
        }
    });

    return { finalAnswers, textAnswers };
};

const parsePDF = async (buffer) => {
    const data = await pdf(buffer);
    const text = data.text;

    // Split by "Question #"
    // We used "Topic 1Question #1" in the sample.
    const questions = [];
    // Regex to find "Question #" with optional preceding text like "Topic 1"
    const regex = /(?:Topic\s+\d+\s*)?Question\s*#(\d+)/gi;

    let match;
    const matches = [];
    while ((match = regex.exec(text)) !== null) {
        matches.push({ id: parseInt(match[1]), index: match.index });
    }

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];
        const end = next ? next.index : text.length;

        const content = text.slice(current.index, end);

        // Extract Options: Look for "A.", "B.", etc.
        const optionRegex = /([A-E])\.\s/g;
        let optMatch;
        const options = {};
        const optionIndices = [];

        while ((optMatch = optionRegex.exec(content)) !== null) {
            optionIndices.push({ char: optMatch[1], index: optMatch.index });
        }

        if (optionIndices.length > 0) {
            const firstOptIndex = optionIndices[0].index;

            // Question Text
            let qText = content.substring(0, firstOptIndex);
            // Remove the "Question #123" header part
            qText = qText.replace(/(?:Topic\s+\d+\s*)?Question\s*#\d+/, '').trim();

            // Options
            for (let j = 0; j < optionIndices.length; j++) {
                const opt = optionIndices[j];
                const nextOpt = optionIndices[j + 1];
                const optEnd = nextOpt ? nextOpt.index : content.length;
                let optText = content.slice(opt.index + 2, optEnd).trim();
                options[opt.char] = optText;
            }

            questions.push({
                id: current.id,
                question: qText,
                options: options,
            });
        }
    }

    return questions;
};

const main = async () => {
    try {
        if (!fs.existsSync(PDF_PATH) || !fs.existsSync(TXT_PATH)) {
            console.error('Source files missing');
            return;
        }

        console.log('Reading files...');
        const txtContent = fs.readFileSync(TXT_PATH, 'utf-8');
        const { finalAnswers, textAnswers } = parseAnswers(txtContent);
        console.log(`Parsed ${Object.keys(finalAnswers).length} structured answers from TXT.`);

        const pdfBuffer = fs.readFileSync(PDF_PATH);
        const parsedQuestions = await parsePDF(pdfBuffer);
        console.log(`Parsed ${parsedQuestions.length} questions from PDF.`);

        // Merge with Fuzzy Match
        const finalQuestions = parsedQuestions.map(q => {
            let correct = finalAnswers[q.id] || [];

            // If no correct answer found, try fuzzy match
            if (correct.length === 0 && textAnswers[q.id]) {
                const searchTexts = textAnswers[q.id];
                // Check each option
                Object.entries(q.options).forEach(([char, optText]) => {
                    // Normalize
                    const normOpt = optText.toLowerCase().replace(/[^a-z0-9]/g, '');

                    searchTexts.forEach(searchText => {
                        const normSearch = searchText.toLowerCase().replace(/[^a-z0-9]/g, '');
                        // Check if one contains the other (at least 20 chars to avoid false positives)
                        if (normSearch.length > 15 && normOpt.length > 15) {
                            if (normOpt.includes(normSearch) || normSearch.includes(normOpt)) {
                                if (!correct.includes(char)) correct.push(char);
                            }
                        }
                    });
                });
            }

            const type = correct.length > 1 ? 'multiple' : 'single';
            return {
                id: q.id,
                question: q.question,
                options: q.options,
                correctAnswers: correct.sort(),
                type: type
            };
        });

        const output = {
            exam: "AWS SAA-C03",
            count: finalQuestions.length,
            questions: finalQuestions
        };

        const dir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
        console.log(`Success! Wrote to ${OUTPUT_PATH}`);

    } catch (e) {
        console.error(e);
    }
};

main();
