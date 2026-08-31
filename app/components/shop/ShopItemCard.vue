<template>
  <div class="panel p-3 lg:p-4 flex flex-col transition-shadow hover:shadow-md hover:shadow-black/10">
    <!-- 商品名：仅「用户名颜色」展示（色块下带色彩名）；称号/头像视觉即内容，不再叠文字说明 -->
    <div v-if="isColor" class="flex items-center justify-between gap-2 mb-2">
      <span class="text-xs lg:text-sm font-medium text-zinc-800 truncate">{{ item.name }}</span>
    </div>

    <!-- 商品视觉：称号 = 图片索引，颜色 = 色块 + 着色用户名，头像 = 头像图（所见即所得 [1.3.3]） -->
    <div :class="['rounded-lg bg-zinc-50 flex items-center justify-center px-2 lg:px-3', isColor ? '' : '', isTitle ? 'h-16 lg:h-20' : 'h-20']">
      <img v-if="isTitle" :src="titleImg" :alt="item.name" class="h-7 lg:h-9 w-auto" />
      <div v-else-if="isAvatar">
        <img :src="item.renderValue" :alt="item.name" class="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-black/10" />
      </div>
      <div v-else class="flex items-center gap-2 lg:gap-2.5">
        <span class="w-6 h-6 lg:w-7 lg:h-7 rounded-full border border-black/10 shrink-0" :style="{ background: item.renderValue }" />
        <span class="text-sm lg:text-base font-semibold truncate" :style="{ color: item.renderValue }">{{ sampleName }}</span>
      </div>
    </div>

    <!-- 价格 + 时效（付费租用）；inline-flex + gap 让 🍗 与数字间留固定间距（移动端 44px 触控目标基线） -->
    <div class="flex items-center justify-between mt-2 lg:mt-3 text-sm">
      <span class="font-medium text-amber-600 inline-flex items-center gap-1">
        <span aria-hidden="true" class="text-[13px] leading-none">🍗</span><span class="text-xs lg:text-sm">{{ item.price }}</span>
      </span>
      <span class="text-[11px] lg:text-xs text-zinc-500">{{ item.durationDays }} 天</span>
    </div>

    <!-- 操作：付费商品走购买租用（flex-1 撑底，保证同网格行内按钮垂直对齐不漂移）。
         min-h-11(44px) 保证手机端触控区达标（原先 py-1.5 仅约 33px，低于 44px 目标） -->
    <div class="flex-1" />
    <button
      class="btn btn-primary mt-2 lg:mt-3 w-full py-2 lg:py-2.5 text-xs lg:text-sm min-h-10 lg:min-h-11 flex items-center justify-center font-medium"
      @click="emit('buy')"
    >
      购买
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ShopItem } from '~/types'
import { titleIconPath } from '~/utils/decoration'

/**
 * 装饰商品卡：称号展示图片索引、颜色展示色块 + 着色用户名。
 * 视觉即「买后戴上的样子」，与帖子/评论区渲染同源（称号图 / 用户名颜色）。
 * 头像商品：付费租用（点「购买」走商城购买链路）。免费池头像不在商城展示，
 * 由个人资料头像选择器（AvatarPicker）直接选用。
 */
const props = defineProps<{ item: ShopItem }>()

const emit = defineEmits<{
  buy: []
}>()

const { user } = useAuth()

const isTitle = computed(() => props.item.type === 'title')
const isAvatar = computed(() => props.item.type === 'avatar')
const isColor = computed(() => props.item.type === 'username_color')

/** 称号图片索引 → 资源地址（约定见 utils/decoration.ts） */
const titleImg = computed(() => titleIconPath(props.item.renderValue))

/** 颜色区着色样本文案：优先当前用户名 */
const sampleName = computed(() => user.value?.username ?? '用户名')
</script>
