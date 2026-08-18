<template>
  <div class="bg-zinc-900 border border-zinc-700/50 rounded-lg overflow-hidden">
    <!-- 搜索框 + 板块筛选 -->
    <div class="px-6 py-4 border-b border-zinc-700/50">
      <div class="flex gap-3">
        <div class="relative flex-1">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索帖子…"
            class="w-full h-9 pl-9 pr-3 text-sm bg-zinc-800 border border-zinc-600/50 rounded-md
                   text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                   transition-all"
            @keyup.enter="submitSearch"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
        </div>
        <select
          v-model="category"
          class="h-9 px-3 text-sm bg-zinc-800 border border-zinc-600/50 rounded-md text-zinc-300
                 focus:outline-none focus:border-blue-500/50 cursor-pointer"
        >
          <option value="">全部板块</option>
          <option v-for="c in categories" :key="c.slug" :value="c.slug">{{ c.icon }} {{ c.name }}</option>
        </select>
      </div>
      <!-- 命中统计 -->
      <p v-if="keywordText" class="mt-3 text-xs text-zinc-500">
        搜索「<span class="text-zinc-400">{{ keywordText }}</span>」：共 {{ total }} 条结果
      </p>
    </div>

    <!-- 未输入关键词 -->
    <div v-if="!keywordText && !pending" class="px-6 py-12 text-center text-sm text-zinc-500">
      输入关键词搜索帖子
    </div>

    <!-- 加载中 -->
    <div v-else-if="pending" class="px-6 py-12 text-center text-sm text-zinc-500">
      <span class="inline-block animate-pulse">搜索中...</span>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="errorMessage" class="px-6 py-12 text-center text-sm text-zinc-500">
      {{ errorMessage }}
    </div>

    <!-- 空结果 -->
    <div v-else-if="results.length === 0" class="px-6 py-12 text-center text-sm text-zinc-500">
      未找到与「{{ keywordText }}」相关的内容
    </div>

    <!-- 结果列表 -->
    <div v-else class="divide-y divide-zinc-800">
      <PostItem v-for="post in results" :key="post.id" :post="post" />
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="flex items-center justify-center py-3 border-t border-zinc-700/50">
      <Pagination
        :current-page="page"
        :total-pages="totalPages"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Paginated, PostListItem } from '~/types'
import { useSearch } from '~/composables/useSearch'
import { useCategories } from '~/composables/useCategories'

const route = useRoute()
const { results, total, totalPages, loading, error: searchError, search } = useSearch()
const { categories } = useCategories()

// URL 驱动：q + category 放 query（可分享/可刷新），page 用本地 ref
const keywordText = computed<string>(() => (route.query.q as string) || '')
const category = computed<string>({
  get: () => (route.query.category as string) || '',
  set: (val) => {
    navigateTo({
      path: '/search',
      query: { q: keywordText.value, ...(val ? { category: val } : {}) },
    })
  },
})

const keyword = ref(keywordText.value)
const page = ref(1)

// 切换关键词/板块时回到第一页（先于 useAsyncData 的 watcher，避免多拉一次错误页码）
watch([keywordText, category], () => {
  page.value = 1
})

// SSR 时也执行并等待数据返回；参数变化自动重新拉取。
// 未输入关键词时返回空分页（而非 undefined），避免触发 useAsyncData 重复请求警告。
const { pending, error: dataError } = useAsyncData(
  'search-result',
  () => {
    if (!keywordText.value) {
      return Promise.resolve<Paginated<PostListItem>>({
        items: [], page: 1, pageSize: 0, total: 0, totalPages: 0,
      })
    }
    return search({
      q: keywordText.value,
      category: category.value || undefined,
      page: page.value,
    })
  },
  { watch: [keywordText, category, page] }
)

function submitSearch() {
  const q = keyword.value.trim()
  if (!q) return
  navigateTo({
    path: '/search',
    query: { q, ...(category.value ? { category: category.value } : {}) },
  })
}

function handlePageChange(newPage: number) {
  page.value = newPage
}

const errorMessage = computed(() => (dataError.value ? '搜索失败' : searchError.value))
</script>
