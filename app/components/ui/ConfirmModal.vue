<template>
  <AppModal :model-value="modelValue" :title="title" width="sm" @update:model-value="emit('update:modelValue', $event)">
    <!-- 说明文案（支持换行）；有默认插槽时插槽内容追加在文案下方 -->
    <p v-if="message" class="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{{ message }}</p>
    <div v-if="$slots.default" class="mt-3">
      <slot />
    </div>

    <!-- 底部操作（btn utility 收口：统一圆角/焦点环/禁用态；主色 blue 替代历史 sky） -->
    <div class="flex justify-end items-center gap-2 mt-6">
      <button
        class="btn btn-ghost px-4 py-2 text-sm font-medium"
        :disabled="loading"
        @click="cancel"
      >
        {{ cancelText }}
      </button>
      <button
        class="btn px-4 py-2 text-sm font-medium"
        :class="toneClass"
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
 * 确认按钮主色统一 blue（UI 升级出图计划阶段3，替代历史 sky）；
 * 语义色用 tone：primary(蓝) / danger(红·危险) / accent(琥珀·积分/收藏类)。
 * danger 保留为 tone=danger 的便捷别名（历史调用方兼容）。loading 期间禁用按钮并显示「处理中…」。 */
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
  /** 确认按钮语义色：primary(蓝，默认) | danger(红) | accent(琥珀)，默认 primary */
  tone?: 'primary' | 'danger' | 'accent'
  /** 危险操作（红色确认按钮）——tone=danger 的便捷别名，默认 false */
  danger?: boolean
  /** 确认中状态（禁用按钮、防重复提交），默认 false */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  tone: 'primary',
  danger: false,
  loading: false,
})

/** tone → btn-* utility：danger 别名优先于 primary，显式 tone 覆盖别名 */
const toneClass = computed(() => {
  const t = props.tone !== 'primary' ? props.tone : props.danger ? 'danger' : 'primary'
  return t === 'danger' ? 'btn-danger' : t === 'accent' ? 'btn-accent' : 'btn-primary'
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
