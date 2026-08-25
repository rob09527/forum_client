<template>
  <AppModal :model-value="modelValue" :title="title" width="sm" @update:model-value="emit('update:modelValue', $event)">
    <!-- 说明文案（支持换行）；有默认插槽时插槽内容追加在文案下方 -->
    <p v-if="message" class="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{{ message }}</p>
    <div v-if="$slots.default" class="mt-3">
      <slot />
    </div>

    <!-- 底部操作 -->
    <div class="flex justify-end items-center gap-2 mt-6">
      <button
        class="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
        :disabled="loading"
        @click="cancel"
      >
        {{ cancelText }}
      </button>
      <button
        class="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        :class="danger ? 'bg-red-500 hover:bg-red-600' : 'bg-sky-500 hover:bg-sky-600'"
        :disabled="loading"
        @click="emit('confirm')"
      >
        {{ loading ? '处理中…' : confirmText }}
      </button>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
/** 通用确认弹窗：基于 AppModal 的统一确认框，替代原生 confirm()。
 * 使用：父组件 v-model 控制开合，@confirm 里做异步操作（成功后自行关闭）。
 * 危险操作传 danger（红色确认按钮）；loading 期间禁用按钮并显示「处理中…」。 */
interface Props {
  /** v-model：是否显示 */
  modelValue: boolean
  /** 标题 */
  title?: string
  /** 说明文案（支持 \n 换行）；复杂内容用默认插槽 */
  message?: string
  /** 确认按钮文案，默认「确定」 */
  confirmText?: string
  /** 取消按钮文案，默认「取消」 */
  cancelText?: string
  /** 危险操作（红色确认按钮），默认 false */
  danger?: boolean
  /** 确认中状态（禁用按钮、防重复提交），默认 false */
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  title: '确认',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  danger: false,
  loading: false,
})

interface Emits {
  /** v-model 同步（取消/点击遮罩/ESC 时 false，需父组件监听以处理） */
  (e: 'update:modelValue', value: boolean): void
  /** 点击确认按钮 */
  (e: 'confirm'): void
}

const emit = defineEmits<Emits>()

/** 取消：仅关闭弹窗，不派发 confirm */
function cancel() {
  emit('update:modelValue', false)
}
</script>
