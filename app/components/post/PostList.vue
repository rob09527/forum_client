<template>
  <div>
    <!-- 排序按钮：横向排列，移除顶部分页 -->
    <div class="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-zinc-200 bg-zinc-50">
      <div class="flex items-center gap-1.5">
        <button
          v-for="s in sortTabs"
          :key="s.value"
          :class="[
            'px-3 py-1.5 text-sm rounded-md transition-colors inline-flex items-center gap-1.5',
            sortBy === s.value
              ? 'bg-blue-500 text-white font-medium'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          ]"
          @click="selectSort(s.value)"
        >
          <AppIcon v-if="s.icon" :name="s.icon" :size="13" />
          <span>{{ s.label }}</span>
        </button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="px-6 py-12 text-center text-sm text-zinc-500">
      <span class="inline-block animate-pulse">加载中...</span>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="error" class="px-6 py-12 text-center text-sm text-zinc-500">
      {{ error }}
    </div>

    <!-- 空列表（配手账风插画，视觉AI出图 §5 #4） -->
    <div v-else-if="posts.length === 0" class="px-6 py-10 text-center">
      <img
        :src="'/images/empty-state.webp'"
        alt="暂无帖子"
        class="w-48 mx-auto mb-4 rounded-lg"
        loading="lazy"
      />
      <p class="text-sm text-zinc-500">暂无帖子</p>
    </div>

    <!-- 帖子列表 -->
    <div v-else class="divide-y divide-zinc-200">
      <template v-for="(post, idx) in posts" :key="post.id">
        <AdSlot v-if="idx === 5 && inlineAd" :ad="inlineAd" />
        <PostItem :post="post" />
      </template>
    </div>

    <!-- 分页（底部） -->
    <div class="flex items-center justify-center py-3 border-t border-zinc-200">
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostListItem, Advert } from '~/types'
import { sortOptions } from '~/constants/categories'
import { useAdverts } from '~/composables/useAdverts'

const props = defineProps<{
  posts: PostListItem[]
  totalPages: number
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  'sort-change': [sort: string]
  'page-change': [page: number]
}>()

const sortBy = ref('latest')
const currentPage = ref(1)

// 排序 tab：最新 / 热门 + 悬赏筛选（3.5 聚合入口，父组件把 'bounty' 映射为 bountyStatus='escrow' 过滤）
const sortTabs = [
  ...sortOptions,
  { label: '悬赏', value: 'bounty', icon: 'coins' },
]

// 帖子列表内嵌广告（position=inline，多条时每次获取随机抽取一条展示）
const { adverts } = useAdverts()
const inlineAd = ref<Advert | null>(null)
watch(
  () => adverts.value,
  (list) => {
    const pool = list.filter((a) => a.position === 'inline')
    inlineAd.value = pool.length ? pool[Math.floor(Math.random() * pool.length)]! : null
  },
  { immediate: true }
)

function selectSort(sort: string) {
  if (sortBy.value === sort) return
  sortBy.value = sort
  currentPage.value = 1
  emit('sort-change', sort)
}

function handlePageChange(page: number) {
  currentPage.value = page
  emit('page-change', page)
}

defineExpose({ currentPage })
</script>
