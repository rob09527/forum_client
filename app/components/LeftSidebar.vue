<template>
  <aside class="hidden lg:block w-44 flex-shrink-0 relative h-[calc(100vh-3rem)] sticky top-[3rem] overflow-y-auto pt-8 pb-4">
    <!-- 模块衔接过渡带：右缘淡渐变竖线，弱化与中间列表的硬切（视觉AI评审共识 §7.5） -->
    <div class="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200/70 to-transparent" aria-hidden="true" />
    <!-- 板块分类：列表抽到 nav/CategoryList，桌面侧栏与移动端抽屉共用，避免两处漂移 -->
    <div class="mx-3 mb-4">
      <CategoryList
        :categories="categories"
        :active-category="activeCategory"
        @select-category="$emit('select-category', $event)"
      />
    </div>

    <!-- 签到卡片（纯客户端渲染，避免 hydration 不匹配） -->
    <ClientOnly>
      <CheckinCard />
    </ClientOnly>
  </aside>
</template>

<script setup lang="ts">
import type { Category } from '~/types'

defineProps<{
  categories: Category[]
  activeCategory: string
}>()

defineEmits<{
  'select-category': [slug: string]
}>()
</script>
