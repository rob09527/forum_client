<template>
  <aside class="hidden lg:block w-48 flex-shrink-0 border-r border-zinc-700/50 h-[calc(100vh-5.5rem)] sticky top-[5.5rem] overflow-y-auto py-4">
    <nav class="space-y-1 px-3">
      <button
        v-for="cat in categories"
        :key="cat.slug"
        :class="[
          'flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors text-left',
          activeCategory === cat.slug
            ? 'bg-blue-500/10 text-blue-400 font-medium border-l-2 border-blue-400'
            : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50 border-l-2 border-transparent'
        ]"
        @click="$emit('select-category', cat.slug)"
      >
        <span>{{ cat.icon }} {{ cat.name }}</span>
        <span class="text-xs text-zinc-500 font-mono">{{ cat.postCount }}</span>
      </button>
    </nav>

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
