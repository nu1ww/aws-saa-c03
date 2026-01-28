<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200 transition-all hover:shadow-lg">
    <div class="flex justify-between items-start mb-4">
      <span class="text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">Q{{ question.id }}</span>
      <span v-if="isValidated" :class="isCorrect ? 'text-green-600 font-bold' : 'text-red-500 font-bold'">
        {{ isCorrect ? 'Correct' : 'Incorrect' }}
      </span>
    </div>

    <p class="text-lg font-medium text-gray-800 mb-6 leading-relaxed whitespace-pre-wrap">{{ question.question }}</p>

    <div class="space-y-3">
      <div 
        v-for="(text, key) in question.options" 
        :key="key"
        @click="select(key)"
        class="flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors"
        :class="getOptionClass(key)"
      >
        <div class="flex-shrink-0 mt-0.5 mr-3">
          <div 
            v-if="question.type === 'single'"
            class="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center"
            :class="{'bg-blue-600 border-blue-600': isSelected(key)}"
          >
            <div class="w-2 h-2 bg-white rounded-full" v-if="isSelected(key)"></div>
          </div>
          <div 
            v-else
            class="w-5 h-5 rounded border border-gray-300 flex items-center justify-center"
            :class="{'bg-blue-600 border-blue-600': isSelected(key)}"
          >
             <svg v-if="isSelected(key)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
        </div>
        <span class="flex-1 text-gray-700">
           <span class="font-bold mr-2">{{ key }}.</span> {{ text }}
        </span>
        
        <!-- Icons for validation -->
        <div v-if="isValidated" class="ml-2">
            <svg v-if="isOptionCorrect(key)" class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <svg v-if="isOptionWronglySelected(key)" class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </div>
      </div>
    </div>
    
    <div v-if="isValidated && !isCorrect" class="mt-4 p-4 bg-red-50 border border-red-100 rounded text-sm text-red-800">
      <span class="font-bold">Correct Answer:</span> {{ question.correctAnswers.join(', ') }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useQuizStore } from '../../stores/quizStore';

const props = defineProps({
  question: {
    type: Object,
    required: true
  }
});

const store = useQuizStore();

const isSelected = (key) => {
  const ans = store.userAnswers[props.question.id];
  return ans && ans.includes(key);
};

const select = (key) => {
  store.selectOption(props.question.id, key, props.question.type);
};

const isValidated = computed(() => store.pageValidated);

const isCorrect = computed(() => {
  const userAns = store.userAnswers[props.question.id] || [];
  const correctAns = props.question.correctAnswers || [];
  return userAns.length === correctAns.length && userAns.every(val => correctAns.includes(val));
});

const isOptionCorrect = (key) => {
  return props.question.correctAnswers.includes(key);
};

const isOptionWronglySelected = (key) => {
  return isSelected(key) && !isOptionCorrect(key);
};

const getOptionClass = (key) => {
  const selected = isSelected(key);
  
  if (!isValidated.value) {
    return selected 
      ? 'border-blue-500 bg-blue-50' 
      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
  }

  // Validation Mode
  const correct = isOptionCorrect(key);
  
  if (correct) {
    return 'border-green-500 bg-green-50 ring-2 ring-green-200';
  }
  
  if (selected && !correct) {
    return 'border-red-500 bg-red-50 ring-2 ring-red-200';
  }
  
  return 'border-gray-200 opacity-60';
};
</script>
