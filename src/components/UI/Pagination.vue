<template>
  <div class="flex justify-between items-center bg-white p-4 rounded-lg shadow mt-6 border border-gray-200 sticky bottom-4 z-10">
    <button 
      @click="$emit('prev')" 
      :disabled="current === 1"
      class="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
      Previous
    </button>

    <div class="text-sm text-gray-600 font-medium">
      Page <span class="text-gray-900">{{ current }}</span> of <span class="text-gray-900">{{ total }}</span> 
    </div>

    <button 
      @click="$emit('next')" 
      :disabled="current === total"
      class="flex items-center px-4 py-2 border border-blue-600 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed transition-all shadow-sm"
    >
      Next
      <svg class="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  current: Number,
  total: Number
});
defineEmits(['prev', 'next']);
</script>
