<template>
  <div class="flex flex-col items-center gap-2.5">
    <!-- 页码条：上一页 / 页码(首尾固定 + 省略号折叠) / 下一页 -->
    <div class="flex items-center gap-0.5 text-xs font-mono">
      <button
        :disabled="currentPage <= 1"
        class="px-2 py-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-default inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 rounded"
        aria-label="上一页"
        @click="$emit('page-change', currentPage - 1)"
      ><AppIcon name="chevron-left" :size="13" /></button>

      <template v-for="(item, idx) in visiblePages" :key="idx">
        <span
          v-if="item.kind === 'ellipsis'"
          class="px-1 text-zinc-400 select-none"
          aria-hidden="true"
        >…</span>
        <button
          v-else
          :class="[
            'w-7 h-7 flex items-center justify-center rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
            item.value === currentPage
              ? 'bg-blue-500/85 text-white shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 hover:shadow-sm hover:-translate-y-px'
          ]"
          :aria-current="item.value === currentPage ? 'page' : undefined"
          @click="$emit('page-change', item.value)"
        >{{ item.value }}</button>
      </template>

      <button
        :disabled="currentPage >= totalPages"
        class="px-2 py-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-default inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 rounded"
        aria-label="下一页"
        @click="$emit('page-change', currentPage + 1)"
      ><AppIcon name="chevron-right" :size="13" /></button>
    </div>

    <!-- 总数 + 跳转指定页（单页时隐藏，避免冗余） -->
    <div v-if="totalPages > 1" class="flex items-center gap-1.5 text-xs text-zinc-500">
      <span>共 <span class="text-zinc-700 font-medium tabular-nums">{{ totalPages }}</span> 页</span>
      <span class="text-zinc-300">|</span>
      <span>跳至</span>
      <input
        v-model="jumpValue"
        inputmode="numeric"
        autocomplete="off"
        class="w-12 h-6 px-1.5 rounded border border-zinc-300 bg-white text-center font-mono text-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
        :aria-label="`跳转页码，共 ${totalPages} 页`"
        @keydown.enter.prevent="doJump"
      />
      <span>页</span>
      <button
        :disabled="!canJump"
        class="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 hover:bg-blue-500 hover:text-white disabled:opacity-30 disabled:cursor-default transition-colors"
        @click="doJump"
      >跳转</button>
    </div>
  </div>
</template>

<script setup lang="ts">
type PageItem = { kind: 'page'; value: number } | { kind: 'ellipsis' }

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()

/**
 * 省略号分页：始终显示首页与末页，当前页前后各留 1 页，其余折叠为省略号。
 * 相比原来的「当前页 ±2 固定窗口」，总页数多时也能一眼看到首尾与范围。
 */
const visiblePages = computed<PageItem[]>(() => {
  const total = props.totalPages
  const current = props.currentPage
  if (total <= 1) return total === 1 ? [{ kind: 'page', value: 1 }] : []

  const pages = new Set<number>([1, total])
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result: PageItem[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) result.push({ kind: 'ellipsis' })
    result.push({ kind: 'page', value: p })
    prev = p
  }
  return result
})

/** 跳转输入：任意整数即可（越界自动夹到 [1, totalPages]），非数字/空串不可跳 */
const jumpValue = ref('')
const canJump = computed(() => {
  const raw = jumpValue.value.trim()
  return raw !== '' && Number.isInteger(Number(raw))
})

function doJump() {
  if (!canJump.value) return
  const target = Math.min(props.totalPages, Math.max(1, Number(jumpValue.value)))
  emit('page-change', target)
  jumpValue.value = ''
}
</script>
