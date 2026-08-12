<template>
  <div class="min-h-screen bg-zinc-900 text-zinc-200 font-sans px-4 lg:px-8 pb-8">
    <AppHeader
      :categories="categories"
      :sub-tags="headerTags"
      :active-category="activeCategory"
      :active-sub-tag="activeSubTag"
      @select-category="handleSelectCategory"
      @toggle-sub-tag="handleToggleSubTag"
    />

    <div class="flex">
      <LeftSidebar
        :categories="categories"
        :active-category="activeCategory"
        @select-category="handleSelectCategory"
      />

      <!-- 中间内容区：公告 + 页面 slot（帖子列表） -->
      <main class="flex-1 min-w-0 lg:ml-4">
        <!-- 公告栏 -->
        <div class="flex items-center gap-3 px-6 py-2.5 border-b border-zinc-700/50 bg-zinc-900/80 text-xs">
          <span class="text-amber-400 font-medium flex-shrink-0">📢 公告</span>
          <div class="flex-1 flex items-center gap-4 overflow-x-auto scrollbar-none">
            <button
              v-for="ann in announcements"
              :key="ann.id"
              class="text-zinc-400 hover:text-zinc-300 whitespace-nowrap transition-colors text-xs"
            >
              <span :class="['mr-1.5', ann.dotColor]">●</span>{{ ann.title }}
            </button>
          </div>
        </div>

        <slot />
      </main>

      <RightSidebar
        :hot-posts="hotPosts"
        :latest-replies="mockLatestReplies"
      />
    </div>

    <!-- 登录/注册弹窗 -->
    <AuthModal />
  </div>
</template>

<script setup lang="ts">
import { mockAnnouncements, mockLatestReplies } from '~/constants/mock-data'

const route = useRoute()
const router = useRouter()

const { categories, tags } = useCategories()
const { restoreSession } = useAuth()

// 当前板块 / 子标签由 URL 驱动：/?category=llm、/?tag=xxx；无参默认全部（general）
// 这样任何页面点板块/标签都会先跳回首页列表，且支持分享链接、浏览器前进后退。
const activeCategory = computed(() => (route.query.category as string) || 'general')
const activeSubTag = computed(() => (route.query.tag as string) || '')

/** 从全量标签池随机抽 5 个展示在 Header，每次导航到首页时重新洗牌 */
const headerTags = ref<string[]>([])
function shuffleHeaderTags() {
  if (tags.value.length <= 5) {
    headerTags.value = [...tags.value]
    return
  }
  // 洗牌后取前 5（用于 UI 展示，不需要密码学级别的均匀分布）
  headerTags.value = [...tags.value].sort(() => Math.random() - 0.5).slice(0, 5)
}
// 路由变化时重新洗牌（同一路由不会重复触发）
watch(() => route.fullPath, shuffleHeaderTags)
// 客户端首次挂载时洗牌
onMounted(() => { if (headerTags.value.length === 0) shuffleHeaderTags() })

// 公告数据（静态，后续可接入 API）
const announcements = mockAnnouncements

// 侧边栏热门帖子（来自后端 /api/posts/hot）
const hotPosts = ref<{ id: number; title: string }[]>([])
if (import.meta.client) {
  // 客户端异步加载，不阻塞首屏
  $fetch<{ success: boolean; data: { id: number; title: string }[] }>('/api/posts/hot')
    .then((res) => {
      if (res.success) hotPosts.value = res.data
    })
    .catch(() => {})
}

// 应用启动时恢复登录状态
if (import.meta.client) {
  restoreSession()
}

/** 点击板块：拼 URL 跳回首页（general=全部，移除 category 参数） */
function handleSelectCategory(slug: string) {
  const query = { ...route.query } as Record<string, string>
  if (slug === 'general') delete query.category
  else query.category = slug
  delete query.tag // 切换板块时清掉子标签，避免筛选叠加
  router.push({ path: '/', query })
}

/** 点击子标签：切换 on/off */
function handleToggleSubTag(tag: string) {
  const query = { ...route.query } as Record<string, string>
  if (tag) query.tag = tag
  else delete query.tag
  router.push({ path: '/', query })
}
</script>
