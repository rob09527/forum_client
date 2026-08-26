<template>
  <div class="panel overflow-hidden">
    <!-- 搜索框 + 板块筛选 -->
    <div class="px-6 py-4 border-b border-zinc-200">
      <div class="flex gap-3">
        <div class="relative flex-1">
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索帖子…"
            class="w-full h-9 pl-9 pr-3 text-sm bg-white border border-zinc-200 rounded-md
                   text-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                   transition-all"
            @keyup.enter="submitSearch"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <AppIcon name="search" :size="14" />
          </span>
        </div>
        <select
          v-model="category"
          class="h-9 px-3 text-sm bg-white border border-zinc-200 rounded-md text-zinc-700
                 focus:outline-none focus:border-blue-500/50 cursor-pointer"
        >
          <option value="">全部板块</option>
          <!-- 原生 option 无法渲染 SVG 图标，只显示板块名 -->
          <option v-for="c in categories" :key="c.slug" :value="c.slug">{{ c.name }}</option>
        </select>
      </div>
      <!-- 命中统计 -->
      <p v-if="keywordText" class="mt-3 text-xs text-zinc-500">
        搜索「<span class="text-zinc-600">{{ keywordText }}</span>」：共 {{ total }} 条结果
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

    <!-- 空结果（配手账风插画，视觉AI出图 §5 #4） -->
    <div v-else-if="results.length === 0" class="px-6 py-10 text-center">
      <img
        :src="'/images/empty-state.webp'"
        alt="未找到相关内容"
        class="w-44 mx-auto mb-4 rounded-lg"
        loading="lazy"
      />
      <p class="text-sm text-zinc-500">未找到与「{{ keywordText }}」相关的内容</p>
    </div>

    <!-- 结果列表 -->
    <div v-else class="divide-y divide-zinc-200">
      <PostItem v-for="post in results" :key="post.id" :post="post" />
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="flex items-center justify-center py-3 border-t border-zinc-200">
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
const { results, total, totalPages, error: searchError, search } = useSearch()
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

// 输入框内容：初始取自 URL，URL 变化（后退/分享链接/浏览器前进）时同步回来
const keyword = ref(keywordText.value)
watch(keywordText, (v) => {
  keyword.value = v
})
const page = ref(1)

// 切换关键词/板块时回到第一页（先于 useAsyncData 的 watcher，避免多拉一次错误页码）
watch([keywordText, category], () => {
  page.value = 1
})

// SSR 时也执行并等待数据返回；参数变化自动重新拉取。
// 未输入关键词时返回空分页（而非 undefined），避免触发 useAsyncData 重复请求警告。
const { data, pending, error: dataError } = useAsyncData(
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

// 客户端 hydration 时 payload 命中 → useAsyncData 不再执行 handler，
// 但 composable 内的 results/total/totalPages 副作用 ref 已重置为空 →
// 从返回值同步回来，避免首屏「空结果」闪烁/误判
watch(data, (v) => {
  results.value = v?.items ?? []
  total.value = v?.total ?? 0
  totalPages.value = v?.totalPages ?? 0
}, { immediate: true })

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
