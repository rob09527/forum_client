<template>
  <div class="flex items-center gap-0.5 text-xs font-mono">
    <button
      :disabled="currentPage <= 1"
      class="px-2 py-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-default"
      @click="$emit('page-change', currentPage - 1)"
    >◀</button>
    <button
      v-for="p in visiblePagesComputed"
      :key="p"
      :class="[
        'w-7 h-7 flex items-center justify-center rounded transition-colors',
        p === currentPage
          ? 'bg-blue-500 text-white'
          : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50'
      ]"
      @click="$emit('page-change', p)"
    >{{ p }}</button>
    <button
      :disabled="currentPage >= totalPages"
      class="px-2 py-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-default"
      @click="$emit('page-change', currentPage + 1)"
    >▶</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

defineEmits<{
  'page-change': [page: number]
}>()

const visiblePagesComputed = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, props.currentPage - 2)
  const end = Math.min(props.totalPages, props.currentPage + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
</script>
