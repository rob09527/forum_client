<template>
  <!-- 移动端：使用 min-h 而非固定 h，让内容自适应；桌面端：相对高度 -->
  <div class="panel overflow-hidden flex flex-col lg:flex-row lg:h-[calc((100vh-7rem)*0.88)] max-lg:min-h-[calc(100vh-4rem-3.5rem)] lg:min-h-[420px]">
    <!-- 移动端：会话列表或聊天窗（二选一全屏显示） -->
    <!-- 桌面端：左栏会话列表 -->
    <div
      class="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 border-zinc-200 flex flex-col"
      :class="{ 'max-lg:hidden': activeConversationId !== null }"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
        <h1 class="text-sm font-semibold text-zinc-800">私信</h1>
        <PrivacyMenu />
      </div>
      <ConversationList />
    </div>

    <!-- 桌面端：右栏聊天窗 -->
    <!-- 移动端：选中会话后全屏显示聊天窗 -->
    <div
      class="flex-1 min-w-0 flex flex-col"
      :class="{ 'max-lg:hidden': activeConversationId === null }"
    >
      <template v-if="activeConversationId !== null && otherUser">
        <!-- 顶部工具栏 - 移动端添加返回按钮 -->
        <div class="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 bg-zinc-50 shrink-0">
          <button
            class="lg:hidden -ml-2 p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            @click="closeChat"
            title="返回会话列表"
          >
            <AppIcon name="chevron-left" :size="20" />
          </button>
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

const { conversations, activeConversationId, loadConversations, selectConversation, closeConversation } = useMessages()
const route = useRoute()

const otherUser = computed(() =>
  conversations.value.find((c) => c.id === activeConversationId.value)?.otherUser ?? null
)

/** 移动端返回会话列表 */
function closeChat(): void {
  closeConversation()
}

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
