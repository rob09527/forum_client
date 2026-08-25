<template>
  <!-- 委托通用 AppIcon 渲染；未命中目录（后台仍填 emoji 或自定义 key）时由 AppIcon 回退原样显示 -->
  <AppIcon :name="name" :size="size" :stroke="stroke" />
</template>

<script setup lang="ts">
/**
 * 板块图标组件：按 key 渲染 lucide 线性 SVG，key 由后台 categories.icon 配置。
 * 自 UI 升级出图计划阶段2 起委托 AppIcon（同一套图标集 + 回退逻辑），保持对外 API 不变。
 */
defineProps<{ name: string; size?: number; stroke?: number }>()
</script>
