<template>
  <div class="border-t border-zinc-200 p-3 flex items-end gap-2">
    <textarea
      ref="textareaRef"
      v-model="text"
      rows="1"
      maxlength="2000"
      placeholder="输入私信…（Enter 发送，Shift+Enter 换行）"
      class="flex-1 resize-none max-h-32 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
      @keydown.enter.exact.prevent="submit"
      @input="autoResize"
    />
    <button
      class="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      :disabled="!canSend || sending"
      title="发送"
      @click="submit"
    >
      <AppIcon name="send" :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useMessages } from '~/composables/useMessages'
import { extractErrorMessage } from '~/composables/api'

/** 私信输入框：Enter 发送、Shift+Enter 换行、发送中禁用 */
const { sendMessage } = useMessages()
const toast = useToast()

const text = ref('')
const sending = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const canSend = computed(() => text.value.trim().length > 0)

async function submit(): Promise<void> {
  const content = text.value.trim()
  if (!content || sending.value) return
  sending.value = true
  try {
    await sendMessage(content)
    text.value = ''
    nextTick(autoResize)
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '发送失败'), color: 'error' })
  } finally {
    sending.value = false
  }
}

function autoResize(): void {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`
}
</script>
