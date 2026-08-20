<template>
  <!-- 外层不再盖 bg-white，透出 body 的全景背景图（含遮罩）。
       导航栏独立于内容区外全宽 sticky，内容区自持 padding 对齐 -->
  <div class="min-h-screen text-zinc-800 font-sans">
    <AppHeader />

    <div class="px-4 lg:pl-[10vw] lg:pr-4 pb-8">
      <div class="flex">
      <LeftSidebar
        :categories="categories"
        :active-category="activeCategory"
        @select-category="handleSelectCategory"
      />

      <!-- 中间内容区：公告 + 页面 slot（帖子列表）。max-w 封顶固定横截面，
           左右各留明显间隙（ml-8/mr-8），不再与两侧边栏贴线 -->
      <main class="flex-1 min-w-0 lg:ml-8 lg:mr-8 lg:max-w-[40.95rem] space-y-4 pt-8">
        <!-- 公告栏：单条轮播（多条时自动滚动切到下一条），独立小卡与列表容器间留间距 -->
        <div
          v-if="currentAnnouncement"
          class="panel flex items-center gap-3 px-6 py-2.5 text-xs"
        >
          <!-- 二轮整改：喇叭图标与“公告”文字留出间距 -->
          <span class="text-amber-600 font-medium flex-shrink-0"><span class="mr-1">📢</span>公告</span>
          <div class="flex-1 min-w-0 h-5 overflow-hidden">
            <Transition name="announce" mode="out-in">
              <NuxtLink
                v-if="currentAnnouncement.link?.startsWith('/')"
                :key="currentAnnouncement.id"
                :to="currentAnnouncement.link"
                class="block truncate leading-5 text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <span :class="['mr-1.5', ANNOUNCEMENT_DOT_COLOR[currentAnnouncement.type]]">●</span>{{ currentAnnouncement.title }}
              </NuxtLink>
              <a
                v-else-if="currentAnnouncement.link"
                :key="currentAnnouncement.id"
                :href="externalHref(currentAnnouncement.link)"
                target="_blank"
                rel="noopener noreferrer"
                class="block truncate leading-5 text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <span :class="['mr-1.5', ANNOUNCEMENT_DOT_COLOR[currentAnnouncement.type]]">●</span>{{ currentAnnouncement.title }}
              </a>
              <span v-else :key="currentAnnouncement.id" class="block truncate leading-5 text-zinc-600">
                <span :class="['mr-1.5', ANNOUNCEMENT_DOT_COLOR[currentAnnouncement.type]]">●</span>{{ currentAnnouncement.title }}
              </span>
            </Transition>
          </div>
        </div>

        <slot />
      </main>

      <RightSidebar
        :hot-posts="hotPosts"
        :new-users="newUsers"
      />
    </div>

        <!-- 登录/注册弹窗 -->
        <AuthModal />
      </div>
    </div>
  </template>

<script setup lang="ts">
import { ANNOUNCEMENT_DOT_COLOR } from '~/types'
import type { Announcement, NewUser } from '~/types'
import { useAnnouncements } from '~/composables/useAnnouncements'

const route = useRoute()
const router = useRouter()

const { categories } = useCategories()
const { restoreSession } = useAuth()
const { getHotPosts } = usePosts()
const { getLatestUsers } = useUserProfile()
const { getAnnouncements } = useAnnouncements()

// 当前板块由 URL 驱动：/?category=llm；无参默认全部（general）
// 这样任何页面点板块都会先跳回首页列表，且支持分享链接、浏览器前进后退。
const activeCategory = computed(() => (route.query.category as string) || 'general')

// 公告数据（SSR 拉取，上线公告按 sortOrder 倒序）
const { data: announcements } = useAsyncData<Announcement[]>(
  'announcements',
  () => getAnnouncements(),
  { default: () => [] }
)

// 公告单条轮播：一次只显示一条，多条时每 4 秒滚动切到下一条
const currentIndex = ref(0)
const currentAnnouncement = computed(() => announcements.value[currentIndex.value] ?? null)

/**
 * 外链补全协议：无协议的域名（如 www.baidu.com）自动加 https://。
 * 否则 <a href="www.baidu.com"> 会被浏览器当相对路径，拼成 http://localhost:3000/www.baidu.com。
 */
function externalHref(link: string): string {
  const trimmed = link.trim()
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) return trimmed
  return `https://${trimmed}`
}
const ANNOUNCE_INTERVAL_MS = 4000
let announceTimer: ReturnType<typeof setInterval> | undefined
function startAnnounceTicker() {
  stopAnnounceTicker()
  if (announcements.value.length <= 1) return
  announceTimer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % announcements.value.length
  }, ANNOUNCE_INTERVAL_MS)
}
function stopAnnounceTicker() {
  if (announceTimer) clearInterval(announceTimer)
  announceTimer = undefined
}
onMounted(startAnnounceTicker)
onBeforeUnmount(stopAnnounceTicker)
// 公告数据就绪 / 条数变化时，重置到第一条并重启轮播
watch(
  () => announcements.value.length,
  () => {
    currentIndex.value = 0
    startAnnounceTicker()
  }
)

// 侧边栏热门帖子（来自后端 /api/posts/hot）
const hotPosts = ref<{ id: number; title: string }[]>([])
// 侧边栏最新注册用户（来自后端 /api/users/latest，默认 8 条）
const newUsers = ref<NewUser[]>([])
if (import.meta.client) {
  // 客户端异步加载，不阻塞首屏
  getHotPosts()
    .then((posts) => { hotPosts.value = posts })
    .catch(() => {})
  getLatestUsers(8)
    .then((users) => { newUsers.value = users })
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
</script>

<style scoped>
/* 公告单条轮播的纵向滚动切换动画：旧条向上滚出，新条从下方滚入 */
.announce-enter-active,
.announce-leave-active {
  transition: transform 0.35s ease, opacity 0.35s ease;
}
.announce-enter-from {
  opacity: 0;
  transform: translateY(100%);
}
.announce-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
