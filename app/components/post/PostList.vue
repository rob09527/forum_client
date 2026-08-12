<template>
  <div>
    <!-- 排序 + 分页（顶上） -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-zinc-700/50 bg-zinc-900/80">
      <div class="flex items-center gap-1">
        <button
          v-for="s in sortOptions"
          :key="s.value"
          :class="[
            'px-3 py-1 text-xs rounded-md transition-colors',
            sortBy === s.value
              ? 'bg-zinc-700 text-zinc-200'
              : 'text-zinc-400 hover:text-zinc-300'
          ]"
          @click="selectSort(s.value)"
        >
          {{ s.label }}
        </button>
      </div>
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="px-6 py-12 text-center text-sm text-zinc-500">
      <span class="inline-block animate-pulse">加载中...</span>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="error" class="px-6 py-12 text-center text-sm text-zinc-500">
      {{ error }}
    </div>

    <!-- 空列表 -->
    <div v-else-if="posts.length === 0" class="px-6 py-12 text-center text-sm text-zinc-500">
      暂无帖子
    </div>

    <!-- 帖子列表 -->
    <div v-else class="divide-y divide-zinc-800">
      <template v-for="(post, idx) in posts" :key="post.id">
        <AdSlot
          v-if="idx === 5"
          label="广告位 · 帖子列表内嵌"
          size="728×90"
          variant="inline"
        />
        <PostItem :post="post" />
      </template>
    </div>

    <!-- 分页（底部） -->
    <div class="flex items-center justify-center py-3 border-t border-zinc-700/50">
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostListItem } from '~/types'
import { sortOptions } from '~/constants/categories'

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
