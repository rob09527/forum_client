<script setup lang="ts">
import { EMOJI_GROUPS, STICKERS, stickerUrl, type EmojiGroup, type Sticker } from '~/utils/emoji-data'

/**
 * 表情/表情包选择面板。
 * 纯展示组件:内部管理 Emoji / 表情包 两个 tab,点击某个表情时 emit('select', insertText)。
 * 由 MarkdownEditor 放在弹出层中消费。
 */
const emit = defineEmits<{
  select: [text: string]
}>()

type Tab = 'emoji' | 'sticker'
const tab = ref<Tab>('emoji')

const groups = EMOJI_GROUPS
const stickers = STICKERS

function pickEmoji(e: string) {
  emit('select', e)
}

function pickSticker(s: Sticker) {
  emit('select', `![${s.name}](${stickerUrl(s)}) `)
}
</script>

<template>
  <div class="w-[18.5rem] rounded-xl bg-white border border-zinc-200 shadow-xl overflow-hidden">
    <!-- Tab 头 -->
    <div class="flex border-b border-zinc-200 text-sm">
      <button
        type="button"
        class="flex-1 py-2 text-center transition-colors"
        :class="tab === 'emoji' ? 'text-blue-600 border-b-2 border-blue-500 font-medium' : 'text-zinc-500 hover:text-zinc-800'"
        @click="tab = 'emoji'"
      >
        😀 Emoji
      </button>
      <button
        type="button"
        class="flex-1 py-2 text-center transition-colors"
        :class="tab === 'sticker' ? 'text-blue-600 border-b-2 border-blue-500 font-medium' : 'text-zinc-500 hover:text-zinc-800'"
        @click="tab = 'sticker'"
      >
        🎁 表情包
      </button>
    </div>

    <!-- Emoji 列表 -->
    <div v-if="tab === 'emoji'" class="max-h-56 overflow-y-auto p-2">
      <div v-for="g in groups" :key="g.name" class="mb-2">
        <p class="text-[11px] text-zinc-400 px-1 mb-1">{{ g.name }}</p>
        <div class="grid grid-cols-8 gap-0.5">
          <button
            v-for="e in g.emojis"
            :key="e"
            type="button"
            class="aspect-square flex items-center justify-center text-xl hover:bg-zinc-100 rounded transition-colors"
            @click="pickEmoji(e)"
          >
            {{ e }}
          </button>
        </div>
      </div>
    </div>

    <!-- 表情包列表 -->
    <div v-else class="max-h-56 overflow-y-auto p-2">
      <div class="grid grid-cols-6 gap-1">
        <button
          v-for="s in stickers"
          :key="s.file"
          type="button"
          class="aspect-square flex items-center justify-center p-1 hover:bg-zinc-100 rounded transition-colors"
          :title="s.name"
          @click="pickSticker(s)"
        >
          <img :src="stickerUrl(s)" :alt="s.name" class="w-full h-full object-contain" loading="lazy" />
        </button>
      </div>
    </div>
  </div>
</template>
