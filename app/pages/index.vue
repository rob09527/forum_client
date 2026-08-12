<template>
  <PostList
    :posts="posts"
    :total-pages="totalPages"
    :loading="pending"
    :error="errorMessage"
    @sort-change="handleSortChange"
    @page-change="handlePageChange"
  />
</template>

<script setup lang="ts">
import { usePosts } from '~/composables/usePosts'

const route = useRoute()

const { posts, totalPages, error: listError, loadPosts } = usePosts()

// 板块 / 标签由 URL 驱动，与 default.vue 的高亮逻辑保持一致
const category = computed<string | undefined>(() => {
  const c = route.query.category as string | undefined
  return !c || c === 'general' ? undefined : c
})
const tag = computed<string | undefined>(() => (route.query.tag as string) || undefined)

const sort = ref<'latest' | 'hot'>('latest')
const page = ref(1)
const pageSize = 20

// 切换板块/标签时回到第一页（先于 useAsyncData 的 watcher，避免多拉一次错误页码）
watch([category, tag], () => {
  page.value = 1
})

// SSR 时也执行并等待数据返回后再序列化；参数变化自动重新拉取
const { pending, error: dataError } = useAsyncData(
  'post-list',
  () => loadPosts({
    category: category.value,
    tag: tag.value,
    sort: sort.value,
    page: page.value,
    pageSize,
  }),
  { watch: [category, tag, sort, page] }
)

function handleSortChange(newSort: string) {
  sort.value = newSort as 'latest' | 'hot'
  page.value = 1
}

function handlePageChange(newPage: number) {
  page.value = newPage
}

const errorMessage = computed(() => dataError.value ? '加载帖子失败' : listError.value)
</script>
