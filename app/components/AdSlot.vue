<template>
  <!-- card 变体：侧边栏方形广告 -->
  <div
    v-if="variant === 'card'"
    class="bg-zinc-800 rounded-lg border border-dashed border-zinc-600/50 flex items-center justify-center"
    :class="adHeightClass"
  >
    <div class="text-center">
      <span class="text-xl block mb-1">📢</span>
      <span class="text-xs text-zinc-500">{{ label }}</span>
      <span class="text-[10px] text-zinc-600 block mt-0.5">{{ size }}</span>
    </div>
  </div>

  <!-- inline 变体：帖子列表内嵌横幅 -->
  <div v-else class="px-6 py-4 bg-zinc-800/30">
    <div class="flex items-center gap-4">
      <div
        class="flex-1 bg-zinc-800 rounded-lg border border-dashed border-zinc-600/50 flex items-center justify-center"
        :class="adHeightClass"
      >
        <div class="text-center">
          <span class="text-sm block mb-1">📢</span>
          <span class="text-xs text-zinc-500">{{ label }}</span>
          <span class="text-[10px] text-zinc-600 block mt-0.5">{{ size }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label?: string
  size?: string
  variant?: 'card' | 'inline'
}>(), {
  label: '广告位',
  size: '300×250',
  variant: 'card',
})

/** 根据 size 标签映射到对应高度 */
const adHeightClass = computed(() => {
  const heightMap: Record<string, string> = {
    '300×250': 'h-40',
    '300×150': 'h-32',
    '728×90': 'h-20',
  }
  return heightMap[props.size] || 'h-32'
})
</script>
