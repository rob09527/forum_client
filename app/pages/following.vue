<template>
  <div>
    <!-- 未登录：引导登录 -->
    <div v-if="!isLoggedIn" class="panel p-10 text-center">
      <p class="text-sm text-zinc-600 mb-4">登录后查看关注动态</p>
      <button class="btn btn-primary px-4 py-1.5 text-sm" @click="openLogin">
        登录
      </button>
    </div>

    <template v-else>
      <div class="panel overflow-hidden">
        <!-- Tab 切换（URL query 驱动，可分享） -->
        <div class="flex items-center gap-2 px-6 py-3 border-b border-zinc-200 bg-zinc-50">
          <button
            v-for="t in tabs"
            :key="t.value"
            class="px-3 py-1 text-xs rounded-md transition-colors inline-flex items-center gap-1"
            :class="activeTab === t.value ? 'bg-zinc-200 text-zinc-800' : 'text-zinc-600 hover:text-zinc-900'"
            @click="switchTab(t.value)"
          >
            <AppIcon :name="t.icon" :size="12" /> {{ t.label }}
          </button>
        </div>

        <!-- 关注动态流 -->
        <template v-if="activeTab === 'feed'">
          <div v-if="feedLoading" class="px-6 py-12 text-center text-sm text-zinc-500">加载中...</div>
          <div v-else-if="feed.length === 0" class="px-6 py-10 text-center">
            <p class="text-sm text-zinc-500">还没有关注任何人的新帖子，去关注几个感兴趣的作者吧～</p>
          </div>
          <div v-else class="divide-y divide-zinc-200">
            <PostItem v-for="p in feed" :key="p.id" :post="p" />
          </div>
          <div v-if="feedTotalPages > 1" class="flex items-center justify-center py-3 border-t border-zinc-200">
            <Pagination :current-page="page" :total-pages="feedTotalPages" @page-change="handlePageChange" />
          </div>
        </template>

        <!-- 关注 / 粉丝用户列表 -->
        <template v-else>
          <div v-if="listLoading" class="px-6 py-12 text-center text-sm text-zinc-500">加载中...</div>
          <div v-else-if="listItems.length === 0" class="px-6 py-10 text-center">
            <p class="text-sm text-zinc-500">{{ activeTab === 'following' ? '还没有关注任何人' : '还没有粉丝' }}</p>
          </div>
          <div v-else class="divide-y divide-zinc-200">
            <NuxtLink
              v-for="u in listItems"
              :key="u.id"
              :to="`/user/${u.id}`"
              class="flex items-center gap-3 px-6 py-3 hover:bg-zinc-100 transition-colors"
            >
              <Avatar :username="u.username" :avatar="u.avatar" size="md" />
              <div class="flex-1 min-w-0">
                <!-- 外层 NuxtLink 已跳转主页，link=false 避免嵌套 <a> -->
                <UsernameText :author="u" size="sm" :link="false" class="min-w-0" />
              </div>
              <span class="text-xs text-zinc-500 inline-flex items-center gap-0.5">主页 <AppIcon name="chevron-right" :size="12" /></span>
            </NuxtLink>
          </div>
          <div v-if="listTotalPages > 1" class="flex items-center justify-center py-3 border-t border-zinc-200">
            <Pagination :current-page="page" :total-pages="listTotalPages" @page-change="handlePageChange" />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { FollowUserItem } from '~/types'
import { useFollow } from '~/composables/useFollow'

const route = useRoute()
const router = useRouter()
const { isLoggedIn, openLogin } = useAuth()

const { feed, feedTotalPages, feedLoading, loadFeed, following, followingTotalPages, loadFollowing, followers, followersTotalPages, loadFollowers } = useFollow()

const tabs = [
  { label: '动态', value: 'feed', icon: 'rss' },
  { label: '关注', value: 'following', icon: 'user' },
  { label: '粉丝', value: 'followers', icon: 'users' },
]

const activeTab = computed(() => {
  const t = route.query.tab
  return t === 'following' || t === 'followers' ? t : 'feed'
})

const page = ref(1)

const listItems = computed<FollowUserItem[]>(() =>
  activeTab.value === 'following' ? following.value : followers.value
)
const listTotalPages = computed(() =>
  activeTab.value === 'following' ? followingTotalPages.value : followersTotalPages.value
)
const listLoading = ref(false)

function switchTab(tab: string) {
  if (tab === activeTab.value) return
  router.push({ query: { ...route.query, tab } })
}

function load() {
  page.value = 1
  if (activeTab.value === 'feed') {
    listLoading.value = false
    loadFeed(1)
  } else if (activeTab.value === 'following') {
    listLoading.value = true
    loadFollowing(1).finally(() => { listLoading.value = false })
  } else {
    listLoading.value = true
    loadFollowers(1).finally(() => { listLoading.value = false })
  }
}

function handlePageChange(newPage: number) {
  page.value = newPage
  if (activeTab.value === 'feed') {
    loadFeed(newPage)
  } else if (activeTab.value === 'following') {
    listLoading.value = true
    loadFollowing(newPage).finally(() => { listLoading.value = false })
  } else {
    listLoading.value = true
    loadFollowers(newPage).finally(() => { listLoading.value = false })
  }
}

// 登录态恢复 + tab 变化时加载
watch([isLoggedIn, activeTab], (v) => {
  if (v[0]) load()
}, { immediate: true })
</script>
