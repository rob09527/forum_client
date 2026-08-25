<template>
  <Teleport to="body">
    <Transition name="app-modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-center justify-center"
        @click.self="close"
      >
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- 弹窗主体 -->
        <div
          class="relative bg-white border border-zinc-200 rounded-2xl shadow-2xl w-full mx-4 overflow-hidden"
          :class="widthClass"
        >
          <!-- 标题栏：无标题且不可关闭时整行不渲染 -->
          <div v-if="title || closable" class="flex items-center justify-between px-6 pt-5">
            <h3 class="text-base font-semibold text-zinc-800 truncate">{{ title }}</h3>
            <button
              v-if="closable"
              class="text-zinc-400 hover:text-zinc-900 transition-colors text-lg leading-none shrink-0 ml-3"
              aria-label="关闭"
              @click="close"
            >
              ✕
            </button>
          </div>

          <!-- 内容区（默认插槽） -->
          <div class="px-6 py-5">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/** 通用弹窗壳：全站消费体系弹窗的统一封装。
 * 统一：Teleport 到 body、遮罩、转场动画、点击遮罩/ESC 关闭、打开时锁定 body 滚动、宽度档位。
 * 新弹窗一律基于本组件搭建，避免各弹窗样式/行为漂移（AuthModal 等存量复杂表单弹窗除外，见前端工作日志）。 */
interface Props {
  /** v-model：是否显示 */
  modelValue: boolean
  /** 弹窗标题（可选；不传则仅展示内容区） */
  title?: string
  /** 宽度档位：sm(384px) | md(448px) | lg(512px) | xl(672px)，默认 md */
  width?: 'sm' | 'md' | 'lg' | 'xl'
  /** 是否显示右上角关闭按钮，默认 true */
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 'md',
  closable: true,
})

interface Emits {
  /** v-model 同步（关闭时 false） */
  (e: 'update:modelValue', value: boolean): void
  /** 关闭完成回调（点击遮罩/ESC/右上角 ✕） */
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

const widthClass = computed(() => {
  const map: Record<NonNullable<Props['width']>, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }
  return map[props.width]
})

/** 关闭：同步 v-model 并派发 close 事件 */
function close() {
  emit('update:modelValue', false)
  emit('close')
}

// ESC 关闭 + body 滚动锁：仅在弹窗打开期间生效（DOM API 均需客户端，SSR 安全）
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.app-modal-enter-active,
.app-modal-leave-active {
  transition: opacity 0.2s ease;
}
.app-modal-enter-active > div:last-child,
.app-modal-leave-active > div:last-child {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.app-modal-enter-from,
.app-modal-leave-to {
  opacity: 0;
}
.app-modal-enter-from > div:last-child {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
.app-modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>
