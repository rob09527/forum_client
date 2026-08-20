<template>
  <aside class="hidden lg:block w-44 flex-shrink-0 relative h-[calc(100vh-3rem)] sticky top-[3rem] overflow-y-auto pt-8 pb-4">
    <!-- 模块衔接过渡带：右缘淡渐变竖线，弱化与中间列表的硬切（视觉AI评审共识 §7.5） -->
    <div class="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200/70 to-transparent" aria-hidden="true" />
    <!-- 板块分类（卡片包裹，与右栏/签到卡片风格统一）
         图标由后台自由配置（cat.icon），前端统一放进"图标砖"呈现，保证设计感一致 -->
    <div class="mx-3 mb-4 panel p-2">
      <h4 class="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 px-1">
        <span class="w-1 h-3.5 rounded-full bg-blue-500/70" aria-hidden="true" />板块
      </h4>
      <nav class="space-y-0.5">
        <button
          v-for="cat in categories"
          :key="cat.slug"
          :class="[
            'group flex items-center justify-between w-full px-2 h-9 text-sm rounded-md transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
            activeCategory === cat.slug
              ? 'bg-blue-500/15 text-blue-600 font-medium border-l-2 border-blue-500'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-l-2 border-transparent'
          ]"
          @click="$emit('select-category', cat.slug)"
        >
          <span class="flex items-center gap-2 min-w-0">
            <span
              aria-hidden="true"
              :class="[
                'w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-150',
                activeCategory === cat.slug
                  ? 'bg-blue-500/15 shadow-[0_1px_2px_rgb(59_130_246_/_0.25)]'
                  : 'bg-zinc-100 group-hover:bg-zinc-200/70 group-hover:-translate-y-px group-hover:shadow-sm'
              ]"
            >
              <CategoryIcon :name="cat.icon" class="w-[18px] h-[18px]" />
            </span>
            <span class="truncate">{{ cat.name }}</span>
          </span>
          <span v-if="Number(cat.postCount) > 0" class="text-xs text-zinc-400 font-mono">{{ cat.postCount }}</span>
        </button>
      </nav>
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
