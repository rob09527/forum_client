<template>
  <div
    :class="[sizeClass, 'relative inline-flex flex-shrink-0 rounded-full overflow-hidden bg-zinc-200']"
    :title="alt || username || ''"
  >
    <!-- 首字母回退：始终渲染，图片加载成功后透明 -->
    <div
      :class="[
        'absolute inset-0 flex items-center justify-center rounded-full font-bold transition-opacity duration-200',
        fallbackTextClass,
        imageLoaded ? 'opacity-0' : 'opacity-100',
      ]"
    >
      {{ initial }}
    </div>
    <!-- 头像图片 -->
    <img
      ref="imgRef"
      v-if="src"
      :src="src"
      :alt="alt || username || ''"
      :class="[
        'w-full h-full rounded-full object-cover transition-opacity duration-200',
        imageLoaded ? 'opacity-100' : 'opacity-0',
      ]"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
import { getAvatarUrl, avatarInitial } from '~/utils/avatar'
import { useAvatarStyles } from '~/composables/useAvatarStyles'

const props = withDefaults(defineProps<{
  username?: string | null
  avatar?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  alt?: string
}>(), {
  size: 'md',
})

const sizeMap: Record<string, string> = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16',
}

const textSizeMap: Record<string, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-2xl',
}

const sizeClass = computed(() => sizeMap[props.size])
const fallbackTextClass = computed(() => `${textSizeMap[props.size]} text-zinc-600`)

// 权威风格清单（后端下发），未就绪时为空数组，getAvatarUrl 内部兜底为单一风格
const { data: avatarStyles } = useAvatarStyles()

const src = computed(() =>
  getAvatarUrl(props.username, props.avatar, avatarStyles.value?.styles, avatarStyles.value?.perStyle),
)
const initial = computed(() => avatarInitial(props.username))

const imgRef = ref<HTMLImageElement | null>(null)
const imageLoaded = ref(false)

function onLoad() {
  imageLoaded.value = true
}

function onError() {
  imageLoaded.value = false
}

// 用户名/头像变化时重置加载状态
watch(() => [props.username, props.avatar], () => {
  imageLoaded.value = false
})

// SSR hydration 修复：浏览器可能在 Vue 挂载 @load 之前就已加载完图片，
// 此时 load 事件永远不会触发，需要在 onMounted 检查图片是否已加载完成
onMounted(() => {
  if (imgRef.value?.complete && imgRef.value.naturalWidth > 0) {
    imageLoaded.value = true
  }
})
</script>
