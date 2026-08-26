<template>
  <div class="flex items-center gap-0.5 text-xs font-mono">
    <button
      :disabled="currentPage <= 1"
      class="px-2 py-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-default inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 rounded"
      :aria-label="'上一页'"
      @click="$emit('page-change', currentPage - 1)"
    ><AppIcon name="chevron-left" :size="13" /></button>
    <button
      v-for="p in visiblePagesComputed"
      :key="p"
      :class="[
        'w-7 h-7 flex items-center justify-center rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
        p === currentPage
          ? 'bg-blue-500/85 text-white shadow-sm'
          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 hover:shadow-sm hover:-translate-y-px'
      ]"
      @click="$emit('page-change', p)"
    >{{ p }}</button>
    <button
      :disabled="currentPage >= totalPages"
      class="px-2 py-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-default inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 rounded"
      :aria-label="'下一页'"
      @click="$emit('page-change', currentPage + 1)"
    ><AppIcon name="chevron-right" :size="13" /></button>
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
