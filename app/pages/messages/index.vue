<template>
  <div class="panel overflow-hidden flex flex-col lg:flex-row h-[calc((100vh-7rem)*0.88)] min-h-[420px]">
    <!-- 左栏：会话列表 + 隐私设置（左小右大，无中间分隔线） -->
    <div class="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 border-zinc-200 flex flex-col">
      <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
        <h1 class="text-sm font-semibold text-zinc-800">私信</h1>
        <PrivacyMenu />
      </div>
      <ConversationList />
    </div>

    <!-- 右栏：聊天窗 -->
    <div class="flex-1 min-w-0 flex flex-col">
      <template v-if="activeConversationId !== null && otherUser">
        <div class="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 bg-zinc-50">
          <Avatar :username="otherUser.username" :avatar="otherUser.avatar" size="sm" />
          <UsernameText :author="otherUser" size="sm" />
        </div>
        <MessageList />
        <MessageInput />
      </template>
      <div v-else class="flex-1 flex items-center justify-center text-sm text-zinc-400">
        选择左侧会话开始聊天
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessages } from '~/composables/useMessages'

const { conversations, activeConversationId, loadConversations, selectConversation } = useMessages()
const route = useRoute()

const otherUser = computed(() =>
  conversations.value.find((c) => c.id === activeConversationId.value)?.otherUser ?? null
)

onMounted(async () => {
  await loadConversations()
  // 深链 ?c=<conversationId>：进入后直接打开该会话
  const c = route.query.c
  if (typeof c === 'string') {
    const id = Number(c)
    if (Number.isInteger(id) && id > 0) {
      await selectConversation(id).catch(() => {})
    }
  }
})
</script>
