<template>
  <AppModal
    :model-value="modelValue"
    :title="`打赏明细（${items.length} 人）`"
    width="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="max-h-[50vh] overflow-y-auto divide-y divide-zinc-200/60 -mx-2 px-2">
      <div v-for="t in items" :key="t.id" class="flex items-center gap-3 py-3">
        <Avatar :username="t.fromUser.username" :avatar="t.fromUser.avatar" size="sm" />
        <div class="flex-1 min-w-0">
          <UsernameText :author="t.fromUser" size="sm" :link="false" />
          <p v-if="t.message" class="text-xs text-zinc-500 mt-0.5 truncate">{{ t.message }}</p>
        </div>
        <span class="text-sm font-medium text-amber-600 shrink-0">+{{ t.amount }}</span>
        <span class="text-xs text-zinc-400 shrink-0">{{ timeText(t.createdAt) }}</span>
      </div>
      <div v-if="items.length === 0" class="py-10 text-center text-sm text-zinc-500">
        还没有人打赏
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import type { TipItem } from '~/types'

/**
 * 打赏明细弹窗 [1.5.3][3.4]：谁赏了多少、留言公开（不做匿名）。
 * 纯展示组件，数据由父组件（PostTipSummary）传入。
 */
defineProps<{
  modelValue: boolean
  items: TipItem[]
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

function timeText(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
