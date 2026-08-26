<template>
  <div class="flex w-full" :class="isMine ? 'justify-end' : 'justify-start'">
    <div class="max-w-[78%]">
      <div
        class="px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words"
        :class="isMine
          ? 'bg-blue-500 text-white rounded-br-sm'
          : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm'"
      >
        {{ message.content }}
      </div>
      <div class="text-[10px] text-zinc-400 mt-1" :class="isMine ? 'text-right' : 'text-left'">
        <span v-if="isMine" :class="message.readAt ? 'text-zinc-400' : 'text-zinc-300'">
          {{ message.readAt ? '已读' : '未读' }} ·
        </span>{{ time }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Message } from '~/types'

/** 单条私信气泡：本人右对齐蓝底，对方左对齐白底 */
const props = defineProps<{
  message: Message
  isMine: boolean
}>()

const time = computed(() =>
  new Date(props.message.createdAt).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
)
</script>
