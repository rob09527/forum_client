<template>
  <div class="flex-1 min-h-0 overflow-y-auto">
    <div v-if="loading && conversations.length === 0" class="p-6 text-center text-sm text-zinc-400">
      加载中…
    </div>
    <div v-else-if="conversations.length === 0" class="p-6 text-center text-sm text-zinc-500">
      还没有私信会话
    </div>
    <button
      v-for="c in conversations"
      :key="c.id"
      class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
      :class="c.id === activeConversationId ? 'bg-blue-50' : 'hover:bg-zinc-50'"
      @click="selectConversation(c.id)"
    >
      <div class="relative flex-shrink-0">
        <Avatar :username="c.otherUser.username" :avatar="c.otherUser.avatar" size="md" />
        <span
          v-if="c.unreadCount > 0"
          class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center"
        >
          {{ c.unreadCount > 99 ? '99+' : c.unreadCount }}
        </span>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <UsernameText :author="c.otherUser" size="sm" :show-badges="false" />
          <span class="text-[10px] text-zinc-400 flex-shrink-0">{{ timeText(c.lastMessageAt) }}</span>
        </div>
        <p class="text-xs text-zinc-500 truncate mt-0.5">{{ c.lastMessagePreview || '（暂无消息）' }}</p>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useMessages } from '~/composables/useMessages'

/** 会话列表（左栏）：头像 + 用户名 + 预览 + 时间 + 未读角标 */
const { conversations, activeConversationId, loading, selectConversation } = useMessages()

function timeText(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}
</script>
