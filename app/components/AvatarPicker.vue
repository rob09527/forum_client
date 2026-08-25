<template>
  <div>
    <p class="text-sm text-zinc-600 mb-3">
      选择本地头像（{{ styles.length }} 个风格 × {{ perStyle }} 个）
      <span class="text-xs text-zinc-400">· 🔒 为付费头像，点击前往商城解锁</span>
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

    <!-- 当前风格的 20 个头像：免费可点选，付费 🔒 角标 + 价格、点击去商城 -->
    <div v-if="expandedStyle" class="grid grid-cols-8 gap-1.5 max-h-[320px] overflow-y-auto">
      <button
        v-for="n in perStyle"
        :key="n"
        class="relative rounded-lg transition-all border-2"
        :class="isSelected(expandedStyle, n)
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-zinc-200 bg-white hover:border-zinc-200'"
        @click="onAvatarClick(expandedStyle, n)"
      >
        <img
          :src="localAvatarPath(expandedStyle, n)"
          :alt="`${expandedStyle}-${n}`"
          class="w-full h-full rounded-md"
          loading="lazy"
        />
        <span
          v-if="isPaid(expandedStyle, n)"
          class="absolute inset-x-0 bottom-0 rounded-b-md bg-black/60 text-white text-[10px] py-0.5 flex items-center justify-center gap-0.5"
        >
          🔒 {{ priceOf(expandedStyle, n) }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { deriveStyleDefs, localAvatarPath } from '~/utils/avatar'
import { useAvatarStyles } from '~/composables/useAvatarStyles'
import { useShop } from '~/composables/useShop'

const props = defineProps<{
  /** 当前头像路径（/avatars/...），用于高亮已选中的头像 */
  currentAvatar?: string
}>()

const emit = defineEmits<{
  /** 选中某个免费本地头像，传出完整路径 */
  select: [avatar: string]
}>()

const toast = useToast()

// 权威风格清单与每风格数量由后端下发；未就绪时为空数组，列表暂不渲染（不会闪错头像）
const { data: avatarStyles } = useAvatarStyles()
const styles = computed(() => deriveStyleDefs(avatarStyles.value?.styles ?? []))
const perStyle = computed(() => avatarStyles.value?.perStyle ?? 20)

/**
 * 头像商品价目表 path → price（头像商品化）：
 * 从商城 items（type='avatar'）构建；播种前（无 avatar 商品行）priceMap 为空 → 全部按免费处理（向后兼容）。
 */
const { items, fetchItems } = useShop()
const priceMap = computed(() => {
  const m = new Map<string, number>()
  for (const it of items.value) {
    if (it.type === 'avatar') m.set(it.renderValue, it.price)
  }
  return m
})
onMounted(() => {
  fetchItems()
})

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

/** 某个头像的商品价格（无商品行 → 0 = 免费） */
function avatarPrice(style: string, n: number): number {
  return priceMap.value.get(localAvatarPath(style, n)) ?? 0
}
function isPaid(style: string, n: number): boolean {
  return avatarPrice(style, n) > 0
}
function priceOf(style: string, n: number): number {
  return avatarPrice(style, n)
}

/** 免费 → 选中；付费 → 引导去商城解锁（跳 /shop + toast） */
function onAvatarClick(style: string, n: number) {
  if (isPaid(style, n)) {
    toast.add({ title: `「${style}-${String(n).padStart(2, '0')}」需在商城解锁 →`, color: 'warning' })
    navigateTo('/shop?sub=avatar')
    return
  }
  emit('select', localAvatarPath(style, n))
}
</script>
