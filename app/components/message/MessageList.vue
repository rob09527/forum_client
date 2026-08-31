<template>
  <div ref="scrollRef" class="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-1.5" @scroll="onScroll">
    <div v-if="messages.length === 0" class="h-full flex items-center justify-center text-sm text-zinc-400">
      暂无消息，打个招呼吧
    </div>
    <MessageBubble
      v-for="m in messages"
      :key="m.id"
      :message="m"
      :is-mine="m.senderId === myId"
    />
  </div>
</template>

<script setup lang="ts">
import { useMessages } from '~/composables/useMessages'
import { useAuth } from '~/composables/useAuth'

/** 消息历史（游标分页 + 上滚加载更早 + 新消息自动滚到底） */
const { messages, loadOlder, activeConversationId } = useMessages()
const { user } = useAuth()

const myId = computed(() => user.value?.id ?? -1)
const scrollRef = ref<HTMLElement | null>(null)
const nearBottom = ref(true)
const loadingOlder = ref(false)
const userHasScrolled = ref(false)

/** 滚动重置定时器（普通变量，不需要响应式） */
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

function scrollToBottom(smooth = false): void {
  nextTick(() => {
    const el = scrollRef.value
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      })
    }
  })
}

/** 距离底部的阈值（px），超过此距离视为用户主动上滚 */
const SCROLL_THRESHOLD = 80
/** 滚到顶部的阈值（px），触发历史消息加载 */
const LOAD_OLDER_THRESHOLD = 60
/** 用户滚动后重置标记的延迟（ms） */
const SCROLL_RESET_DELAY = 3000

function onScroll(): void {
  const el = scrollRef.value
  if (!el) return

  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  nearBottom.value = distanceFromBottom < SCROLL_THRESHOLD

  // 用户主动滚动（非底部）时标记已滚动，防止新消息自动跳底打断阅读
  if (distanceFromBottom > SCROLL_THRESHOLD) {
    userHasScrolled.value = true
    // 延迟后重置标记（假设用户看完了，新消息可以自动滚底）
    if (scrollTimeout) clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      userHasScrolled.value = false
    }, SCROLL_RESET_DELAY)
  } else {
    userHasScrolled.value = false
  }

  // 滚到顶部附近加载更早历史
  if (el.scrollTop < LOAD_OLDER_THRESHOLD) loadOlderMessages()
}

async function loadOlderMessages(): Promise<void> {
  if (loadingOlder.value) return
  loadingOlder.value = true
  const el = scrollRef.value
  const prevHeight = el?.scrollHeight ?? 0
  try {
    await loadOlder()
  } finally {
    loadingOlder.value = false
    // 前插历史后保持视口位置不跳（把旧内容推回原位置）
    nextTick(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight
    })
  }
}

// 新消息时的智能滚动：只有在底部附近且用户未主动滚动时才自动跟随
watch(messages, (newMessages, oldMessages) => {
  // 检测是否有新消息（长度增加）
  if (newMessages.length > oldMessages.length) {
    // 如果在底部附近且用户没有主动往上滚，才自动滚底
    if (nearBottom.value && !userHasScrolled.value) {
      // 使用平滑滚动，避免突兀跳动
      scrollToBottom(true)
    }
  }
})

// 切换会话时重置到底部（不平滑，直接跳）
watch(activeConversationId, () => {
  nearBottom.value = true
  userHasScrolled.value = false
  scrollToBottom(false)
})

onMounted(() => {
  scrollToBottom(false)
})

onBeforeUnmount(() => {
  if (scrollTimeout) clearTimeout(scrollTimeout)
})
</script>
