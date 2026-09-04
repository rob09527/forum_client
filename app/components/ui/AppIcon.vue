<template>
  <svg
    v-if="paths"
    v-bind="$attrs"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <g v-html="paths" />
  </svg>
  <!-- 未命中图标集（历史遗留/自定义 key）：回退原样显示字符串，兼容不破坏 -->
  <span v-else-if="!silent" v-bind="$attrs" class="leading-none">{{ name }}</span>
</template>

<script setup lang="ts">
import { CATEGORY_ICONS, ICONS } from '~/constants/icons'

/**
 * 全站通用线性图标组件（UI 升级出图计划阶段2）：
 * 将散落各文件的功能位 emoji（🔍🔔👍🛒 等）统一为 lucide 线性 SVG，
 * 与分类图标（CategoryIcon）同风格（viewBox 24 / stroke 1.6 / currentColor）。
 * 用法：<AppIcon name="search" :size="16" />；颜色继承父级 text-*。
 *
 * 模板是 v-if / v-else-if 双分支根节点，隐式 attr 继承在 SSR 与客户端表现不一致
 * （服务端渲染丢掉外部传入的 class，水合时报 class mismatch），所以关掉隐式继承、
 * 两个分支各自显式 v-bind="$attrs"。
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** 图标 key（见 constants/icons.ts，ICONS 与 CATEGORY_ICONS 均可命中） */
  name: string
  /** 像素尺寸（宽高同值），默认 16 */
  size?: number
  /** 描边宽度，默认 1.6（与图标集统一） */
  stroke?: number
  /** 未命中 key 时静默不渲染；默认 false（回退原样显示字符串） */
  silent?: boolean
}>(), {
  size: 16,
  stroke: 1.6,
  silent: false,
})

const paths = computed(() => ICONS[props.name] ?? CATEGORY_ICONS[props.name] ?? null)
</script>
