<template>
  <Teleport to="body">
    <Transition name="chat-drawer">
      <div
        v-if="drawerOpen"
        class="fixed bottom-4 right-4 z-[90] w-[360px] h-[520px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <template v-if="activeConversationId !== null && otherUser">
          <!-- 头部：对方用户名 + 打开私信页 + 关闭 -->
          <div class="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 bg-zinc-50">
            <Avatar :username="otherUser.username" :avatar="otherUser.avatar" size="sm" />
            <UsernameText :author="otherUser" size="sm" :show-badges="false" class="flex-1 min-w-0" />
            <NuxtLink
              to="/messages"
              class="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
              title="打开私信页"
            >
              <AppIcon name="mail" :size="16" />
            </NuxtLink>
            <button
              class="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
              title="关闭"
              @click="closeDrawer"
            >
              <AppIcon name="x" :size="16" />
            </button>
          </div>

          <MessageList />
          <MessageInput />
        </template>

        <!-- 无活跃会话空态 -->
        <div v-else class="flex-1 flex items-center justify-center text-sm text-zinc-400">
          暂无会话
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useMessages } from '~/composables/useMessages'

/** 浮动聊天窗：任意页弹出，与 /messages 页共享同一份会话/消息状态 */
const { drawerOpen, activeConversationId, conversations, closeDrawer } = useMessages()

const otherUser = computed(() =>
  conversations.value.find((c) => c.id === activeConversationId.value)?.otherUser ?? null
)
</script>

<style scoped>
.chat-drawer-enter-active,
.chat-drawer-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.chat-drawer-enter-from,
.chat-drawer-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
</style>
