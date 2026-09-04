<template>
  <div>
    <!-- 未登录：引导登录。authUser 由布局的 restoreSession 在客户端恢复，
         SSR 和首帧时为 null，故未登录先显示提示（与 AppHeader 登录按钮同策略） -->
    <div v-if="!isLoggedIn" class="panel p-10 text-center">
      <p class="text-sm text-zinc-600 mb-4">登录后查看你发布的帖子</p>
      <button
        class="px-4 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        @click="openLogin"
      >
        登录
      </button>
    </div>

    <!-- 已登录：我的帖子列表 -->
    <template v-else>
      <div class="panel overflow-hidden">
        <div class="flex items-center px-6 py-3 border-b border-zinc-200 bg-white/60">
          <h1 class="text-sm font-medium text-zinc-700 inline-flex items-center gap-1.5">
            <AppIcon name="file-text" :size="14" /> 我的帖子
          </h1>
        </div>
        <PostList
          :posts="posts"
          :total-pages="totalPages"
          :current-page="page"
          :loading="loading"
          :loading-more="loadingMore"
          :error="error"
          @sort-change="handleSortChange"
          @page-change="handlePageChange"
          @load-more="handleLoadMore"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePosts } from '~/composables/usePosts'

const { user, isLoggedIn, openLogin } = useAuth()
const { posts, totalPages, loading, loadingMore, error, loadPosts, loadMorePosts } = usePosts()

const sort = ref<'latest' | 'hot'>('latest')
const page = ref(1)
const pageSize = 20

/** 组装查询参数（page 由调用方显式传入） */
function buildQuery(p: number) {
  return { authorId: user.value?.id, sort: sort.value, page: p, pageSize }
}

// 登录态从 null → 有值、或排序变化时：重置到第一页并 replace 拉取（用户 ID 只在客户端恢复后才存在，SSR 时 user 为 null 直接跳过）
watch([() => user.value?.id, sort], () => {
  page.value = 1
  if (user.value?.id) loadPosts(buildQuery(1))
}, { immediate: true })

function handleSortChange(newSort: string) {
  sort.value = newSort as 'latest' | 'hot'
  // page 由上面的 watch 重置
}

/** 手动翻页：replace 指定页 */
function handlePageChange(newPage: number) {
  page.value = newPage
  loadPosts(buildQuery(newPage))
}

/** 无限滚动：追加下一页 */
async function handleLoadMore() {
  if (!user.value?.id || page.value >= totalPages.value || loading.value || loadingMore.value) return
  const next = page.value + 1
  const ok = await loadMorePosts(buildQuery(next))
  if (ok) page.value = next
}
</script>
