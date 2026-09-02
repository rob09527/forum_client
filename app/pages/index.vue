<template>
  <div class="space-y-4">
    <!-- 首页小 tips 轮播：替代固定品牌标语，克制不占位，每 6s 换一条（§7.14） -->
    <TipsBanner />

    <!-- 标签行：仅PC端显示 -->
    <ClientOnly>
      <div class="hidden lg:flex items-center gap-1 flex-wrap px-1">
        <span class="text-xs text-zinc-400 mr-1 whitespace-nowrap">标签</span>
        <button
          v-for="tag in headerTags"
          :key="tag"
          :class="[
            'px-2 py-0.5 text-[13px] rounded-md transition-colors',
            activeTag === tag
              ? 'text-blue-600 bg-blue-500/10'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          ]"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </ClientOnly>

    <div class="panel overflow-hidden">
      <PostList
        :posts="posts"
        :total-pages="totalPages"
        :loading="pending"
        :error="errorMessage"
        @sort-change="handleSortChange"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePosts } from '~/composables/usePosts'
import { useCategories } from '~/composables/useCategories'

const route = useRoute()
const router = useRouter()

const { posts, totalPages, error: listError, loadPosts } = usePosts()

// 当前板块由 URL 驱动：?category=general 是真实板块「综合讨论」要正常过滤；
// 只有不带 category 参数（undefined）才表示全部帖子。
const category = computed<string | undefined>(() => {
  const c = route.query.category as string | undefined
  return c || undefined
})

// ── 首页标签行（由导航栏第二行移出，§7.13）──
// 从全量标签池随机抽 6 个展示，客户端首次挂载时洗牌一次；高亮由 URL ?tag= 驱动
const { tags } = useCategories()
const activeTag = computed<string | undefined>(() => (route.query.tag as string) || undefined)
const headerTags = ref<string[]>([])
function shuffleTags() {
  headerTags.value = tags.value.length <= 6
    ? [...tags.value]
    : [...tags.value].sort(() => Math.random() - 0.5).slice(0, 6)
}
onMounted(() => {
  if (headerTags.value.length === 0) shuffleTags()
})

function toggleTag(name: string) {
  // 继承 URL 中的 category，只改 tag，避免丢板块参数；不做类型强转（query 值本身可为 string|string[]）
  const query: Record<string, string | (string | null)[] | null | undefined> = {}
  if (route.query.category) query.category = route.query.category
  if (activeTag.value === name) query.tag = undefined
  else query.tag = name
  router.push({ path: '/', query })
}

const sort = ref<'latest' | 'hot'>('latest')
/** 悬赏筛选（PostList「💰 悬赏」tab 开启）：bountyStatus='escrow' 默认展示待解决 [1.6.6] */
const bountyOnly = ref(false)
const page = ref(1)
const pageSize = 20

// 切换板块/标签时回到第一页（先于 useAsyncData 的 watcher，避免多拉一次错误页码）
watch([category, activeTag], () => {
  page.value = 1
})

// SSR 时也执行并等待数据返回后再序列化；参数变化自动重新拉取
const { data, pending, error: dataError } = useAsyncData(
  'post-list',
  () => loadPosts({
    category: category.value,
    tag: activeTag.value,
    sort: sort.value,
    bountyStatus: bountyOnly.value ? 'escrow' : undefined,
    page: page.value,
    pageSize,
  }),
  { watch: [category, activeTag, sort, bountyOnly, page] }
)

// 客户端 hydration 时 payload 命中 → useAsyncData 不再执行 handler，
// 但 composable 内的 posts/totalPages 副作用 ref 已重置为空 → 从返回值同步回来，避免首屏空列表
watch(data, (v) => {
  posts.value = v?.items ?? []
  totalPages.value = v?.totalPages ?? 0
}, { immediate: true })

function handleSortChange(newSort: string) {
  if (newSort === 'bounty') {
    // 「悬赏」是筛选不是排序：切到最新排序 + 开 escrow 过滤，复用列表 [3.5]
    bountyOnly.value = true
    sort.value = 'latest'
  } else {
    bountyOnly.value = false
    sort.value = newSort as 'latest' | 'hot'
  }
  page.value = 1
}

function handlePageChange(newPage: number) {
  page.value = newPage
}

const errorMessage = computed(() => dataError.value ? '加载帖子失败' : listError.value)
</script>

<style scoped>
/* 隐藏横向滚动条（保持滚动功能） */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
