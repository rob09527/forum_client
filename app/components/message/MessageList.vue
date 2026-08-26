<template>
  <div ref="scrollRef" class="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2" @scroll="onScroll">
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

function scrollToBottom(): void {
  nextTick(() => {
    const el = scrollRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function onScroll(): void {
  const el = scrollRef.value
  if (!el) return
  nearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  // 滚到顶部附近加载更早历史
  if (el.scrollTop < 60) loadOlderMessages()
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

// 新消息时若在底部附近则自动跟随滚动
watch(messages, () => {
  if (nearBottom.value) scrollToBottom()
})
// 切换会话时重置到底部
watch(activeConversationId, () => {
  nearBottom.value = true
  scrollToBottom()
})
onMounted(scrollToBottom)
</script>
