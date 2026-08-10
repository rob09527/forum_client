<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="max-w-4xl mx-auto px-4 py-16">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Forum
      </h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">
        Server: {{ serverStatus }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data } = await useFetch('/api/health')
const serverStatus = computed(() =>
  data.value?.status === 'ok' ? 'running ✓' : 'offline ✗'
)
</script>
