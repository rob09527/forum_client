<template>
  <div>
    <p class="text-sm text-zinc-400 mb-3">选择头像风格，同风格可点击 🔄 换种子</p>
    <div class="grid grid-cols-5 gap-2.5 max-h-[420px] overflow-y-auto">
      <button
        v-for="s in styles"
        :key="s.id"
        class="flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all border-2 relative group"
        :class="s.id === selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-zinc-700/50 bg-zinc-800 hover:border-zinc-600'"
        @click="$emit('select', s.id, seedVariant(s.id))"
      >
        <div class="w-12 h-12 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0 relative">
          <img
            :key="`${s.id}-${seedVariant(s.id)}`"
            :src="dicebearUrl(username + seedVariant(s.id), s.id)"
            :alt="s.label"
            class="w-full h-full"
            loading="lazy"
          />
        </div>
        <span class="text-[10px] text-zinc-400 leading-tight text-center">
          {{ s.icon }} {{ s.label }}
        </span>
        <!-- 🔄 换种子 -->
        <button
          class="absolute top-1 right-1 w-5 h-5 rounded-full bg-zinc-700 hover:bg-zinc-600 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="换一个种子"
          @click.stop="shuffleSeed(s.id)"
        >
          🔄
        </button>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DICEBEAR_STYLES, dicebearUrl } from '~/utils/avatar'

const props = defineProps<{
  /** 当前选中的风格 ID */
  currentStyle?: string
  /** 用户名（作为 DiceBear seed 前缀） */
  username: string
}>()

defineEmits<{
  /** 用户点击选择某个风格，附带种子后缀 */
  select: [style: string, seedSuffix: string]
}>()

const styles = DICEBEAR_STYLES

/** 每个风格的随机种子后缀 */
const variants = reactive<Record<string, string>>({})

function randomSuffix(): string {
  return '_' + Math.random().toString(36).slice(2, 8)
}

function seedVariant(styleId: string): string {
  if (!(styleId in variants)) {
    variants[styleId] = randomSuffix()
  }
  return variants[styleId] ?? ''
}

function shuffleSeed(styleId: string) {
  variants[styleId] = randomSuffix()
}

/** 当前高亮的风格 */
const selected = computed(() => props.currentStyle || 'bottts-neutral')
</script>
