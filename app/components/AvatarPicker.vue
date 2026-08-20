<template>
  <div>
    <p class="text-sm text-zinc-600 mb-3">
      选择本地头像（{{ styles.length }} 个风格 × {{ AVATARS_PER_STYLE }} 个）
    </p>

    <!-- 风格分类：点击展开该风格的 20 个头像 -->
    <div class="grid grid-cols-5 gap-2 mb-4">
      <button
        v-for="s in styles"
        :key="s.id"
        class="flex flex-col items-center gap-1 p-2 rounded-lg transition-all border-2"
        :class="expandedStyle === s.id
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-zinc-200 bg-white hover:border-zinc-200'"
        @click="expandedStyle = s.id"
      >
        <div class="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 flex-shrink-0">
          <img :src="localAvatarPath(s.id, 1)" :alt="s.label" class="w-full h-full" loading="lazy" />
        </div>
        <span class="text-[10px] text-zinc-600 leading-tight text-center">{{ s.icon }} {{ s.label }}</span>
      </button>
    </div>

    <!-- 当前风格的 20 个头像 -->
    <div v-if="expandedStyle" class="grid grid-cols-8 gap-1.5 max-h-[320px] overflow-y-auto">
      <button
        v-for="n in AVATARS_PER_STYLE"
        :key="n"
        class="rounded-lg transition-all border-2"
        :class="isSelected(expandedStyle, n)
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-zinc-200 bg-white hover:border-zinc-200'"
        @click="$emit('select', localAvatarPath(expandedStyle, n))"
      >
        <img
          :src="localAvatarPath(expandedStyle, n)"
          :alt="`${expandedStyle}-${n}`"
          class="w-full h-full rounded-md"
          loading="lazy"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AVATARS_PER_STYLE, deriveStyleDefs, localAvatarPath } from '~/utils/avatar'
import { useAvatarStyles } from '~/composables/useAvatarStyles'

const props = defineProps<{
  /** 当前头像路径（/avatars/...），用于高亮已选中的头像 */
  currentAvatar?: string
}>()

defineEmits<{
  /** 选中某个本地头像，传出完整路径 */
  select: [avatar: string]
}>()

// 权威风格清单由后端下发；未就绪时为空数组，列表暂不渲染（不会闪错头像）
const { data: avatarStyles } = useAvatarStyles()
const styles = computed(() => deriveStyleDefs(avatarStyles.value?.styles ?? []))

/** 当前展开的风格（默认高亮到用户当前头像所属风格，否则机器人） */
const expandedStyle = ref<string>(
  (() => {
    const m = props.currentAvatar?.match(/^\/avatars\/([^/]+)\//)
    return m?.[1] ?? 'bottts-neutral'
  })()
)

/** 某个头像是否被选中（按路径精确匹配） */
function isSelected(style: string, n: number): boolean {
  return props.currentAvatar === localAvatarPath(style, n)
}
</script>
