<template>
  <svg
    v-if="paths"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <g v-html="paths" />
  </svg>
  <!-- 未命中目录（后台仍填 emoji 或自定义 key）：回退原样显示 -->
  <span v-else class="leading-none">{{ name }}</span>
</template>

<script setup lang="ts">
import { CATEGORY_ICONS } from '~/constants/icons'

const props = defineProps<{ name: string }>()

const paths = computed(() => CATEGORY_ICONS[props.name] ?? null)
</script>
