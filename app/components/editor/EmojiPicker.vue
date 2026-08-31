<script setup lang="ts">
import { EMOJI_GROUPS, EMOJI_ALIASES, STICKERS, stickerUrl, type Sticker } from '~/utils/emoji-data'

/**
 * 表情/表情包选择面板。
 * 纯展示组件:内部管理 Emoji / 表情包 两个 tab,点击某个表情时 emit('select', insertText)。
 * - Emoji tab 支持搜索(命中 别名/emoji 字符/分组名)与「最近使用」(localStorage)。
 * - 由 MarkdownEditor 放在弹出层中消费。
 */
const emit = defineEmits<{
  select: [text: string]
}>()

type Tab = 'emoji' | 'sticker'
const tab = ref<Tab>('emoji')
const keyword = ref('')

const groups = EMOJI_GROUPS
const stickers = STICKERS

// ── 最近使用:localStorage 持久化,最多 24 个,新选中的排前面 ──
const RECENT_KEY = 'forum-emoji-recent'
const RECENT_MAX = 24
const recent = ref<string[]>(loadRecent())

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const arr = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}
function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list))
  } catch {
    // localStorage 不可用(隐私模式等)时静默忽略,不影响插入
  }
}
function pushRecent(e: string) {
  recent.value = [e, ...recent.value.filter((x) => x !== e)].slice(0, RECENT_MAX)
  saveRecent(recent.value)
}

function pickEmoji(e: string) {
  pushRecent(e)
  emit('select', e)
}

function pickSticker(s: Sticker) {
  emit('select', `![${s.name}](${stickerUrl(s)}) `)
}

// ── 搜索:query 命中 别名 / emoji 字符本身 / 分组名 ──
const query = computed(() => keyword.value.trim().toLowerCase())

/** 单个 emoji 是否命中搜索词 */
function matchEmoji(e: string, groupName: string): boolean {
  const q = query.value
  if (!q) return true
  if (e.includes(q)) return true
  if ((EMOJI_ALIASES[e] ?? []).some((a) => a.includes(q))) return true
  if (groupName.includes(q)) return true
  return false
}

/** 搜索态:扁平化所有命中的 emoji(保留分组名,扁平排列便于浏览) */
const searchResults = computed<{ e: string }[]>(() => {
  const q = query.value
  if (!q) return []
  const out: { e: string }[] = []
  for (const g of groups) {
    for (const e of g.emojis) {
      if (matchEmoji(e, g.name)) out.push({ e })
    }
  }
  return out
})

/** 展示态:空搜索时按组展示(最近使用置顶) */
const visibleGroups = computed(() => {
  if (query.value) return []
  return groups.map((g) => ({
    ...g,
    emojis: g.emojis,
  }))
})
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

    <template v-if="tab === 'emoji'">
      <!-- 搜索框 -->
      <div class="px-2 pt-2">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索表情（赞、笑、哭、心…）"
          class="w-full bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
        />
      </div>

      <div class="max-h-56 overflow-y-auto p-2">
        <!-- 搜索态:扁平结果 -->
        <template v-if="query">
          <p v-if="searchResults.length === 0" class="text-xs text-zinc-400 px-1 py-3 text-center">没有找到匹配的表情</p>
          <div v-else class="grid grid-cols-4 sm:grid-cols-8 gap-0.5">
            <button
              v-for="r in searchResults"
              :key="r.e"
              type="button"
              class="aspect-square flex items-center justify-center text-xl hover:bg-zinc-100 rounded transition-colors"
              @click="pickEmoji(r.e)"
            >
              {{ r.e }}
            </button>
          </div>
        </template>

        <!-- 非搜索态:最近使用 + 分组 -->
        <template v-else>
          <div v-if="recent.length > 0" class="mb-2">
            <p class="text-[11px] text-zinc-400 px-1 mb-1">最近使用</p>
            <div class="grid grid-cols-4 sm:grid-cols-8 gap-0.5">
              <button
                v-for="e in recent"
                :key="e"
                type="button"
                class="aspect-square flex items-center justify-center text-xl hover:bg-zinc-100 rounded transition-colors"
                @click="pickEmoji(e)"
              >
                {{ e }}
              </button>
            </div>
          </div>
          <div v-for="g in visibleGroups" :key="g.name" class="mb-2">
            <p class="text-[11px] text-zinc-400 px-1 mb-1">{{ g.name }}</p>
            <div class="grid grid-cols-4 sm:grid-cols-8 gap-0.5">
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
        </template>
      </div>
    </template>

    <!-- 表情包列表 -->
    <div v-else class="max-h-56 overflow-y-auto p-2">
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-1">
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
