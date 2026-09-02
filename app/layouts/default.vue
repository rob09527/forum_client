<template>
  <!-- Session 恢复中的全局 Loading。
       不加 backdrop-blur：固定整屏遮罩对背后内容逐帧重算模糊，移动端耗电/掉帧，bg-white/85 已足够遮背景 -->
  <div v-if="isRestoring" class="fixed inset-0 bg-white/85 z-50 flex items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <div class="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
      <p class="text-sm text-gray-600">恢复会话中...</p>
    </div>
  </div>

  <!-- 外层不再盖 bg-white，透出 body 的全景背景图（含遮罩）。
       导航栏独立于内容区外全宽 sticky，内容区自持 padding 对齐 -->
  <div class="min-h-screen text-zinc-800 font-sans">
    <AppHeader />

    <div class="px-4 lg:pl-[10vw] lg:pr-4 pb-24 lg:pb-8">
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
          <span class="text-amber-600 font-medium flex-shrink-0 inline-flex items-center gap-1.5"><AppIcon name="megaphone" :size="14" />公告</span>
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

        <div v-if="currentInlineAd" class="overflow-hidden rounded-lg">
          <Transition name="announce" mode="out-in">
            <AdSlot :key="currentInlineAd.id" :ad="currentInlineAd" />
          </Transition>
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

        <!-- 新手引导卡片（非模态，登录后首次出现） -->
        <OnboardingGuide />

        <!-- 浮动私信窗（任意页可唤起，共享 useMessages 状态） -->
        <ChatDrawer />

        <!-- 移动端：底部 tab 导航 + 板块抽屉（lg:hidden，仅手机渲染） -->
        <MobileNav />
        <MobileCategoryDrawer
          :categories="categories"
          :active-category="activeCategory"
          @select-category="handleSelectCategory"
        />
      </div>
    </div>
  </template>

<script setup lang="ts">
import { ANNOUNCEMENT_DOT_COLOR } from '~/types'
import type { Announcement, NewUser } from '~/types'
import { useAnnouncements } from '~/composables/useAnnouncements'
import { useAdverts } from '~/composables/useAdverts'

const route = useRoute()
const router = useRouter()

const { categories } = useCategories()
const { restoreSession, isLoggedIn, isRestoring } = useAuth()
const { getHotPosts } = usePosts()
const { getLatestUsers } = useUserProfile()
const { adverts } = useAdverts()
const { getAnnouncements } = useAnnouncements()
const { startWelcomeTour, isCompleted } = useOnboarding()

// 当前板块由 URL 驱动：/?category=llm 等；无 category 参数 = 全部（真实分类 general=综合讨论，与「全部」无关）。
// 这样任何页面点板块都会先跳回首页列表，且支持分享链接、浏览器前进后退。
// activeCategory 用空串表示「全部」：CategoryList 顶部的「全部」入口选中态据此高亮。
const activeCategory = computed(() => (route.query.category as string) || '')

// 公告数据（SSR 拉取，上线公告按 sortOrder 倒序）
const { data: announcements } = useAsyncData<Announcement[]>(
  'announcements',
  () => getAnnouncements(),
  { default: () => [] }
)

// 公告单条轮播：一次只显示一条，多条时每 4 秒滚动切到下一条
const currentIndex = ref(0)
const currentAnnouncement = computed(() => announcements.value[currentIndex.value] ?? null)

const inlineAdverts = computed(() => adverts.value.filter((a) => a.position === 'inline'))
const currentAdIndex = ref(0)
const currentInlineAd = computed(() => inlineAdverts.value[currentAdIndex.value] ?? null)

/**
 * 外链补全协议：无协议的域名（如 www.baidu.com）自动加 https://。
 * 否则 <a href="www.baidu.com"> 会被浏览器当相对路径，拼成 http://localhost:3000/www.baidu.com。
 */
function externalHref(link: string): string {
  const trimmed = link.trim()
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) return trimmed
  return `https://${trimmed}`
}
/** 公告轮播间隔（毫秒） */
const ANNOUNCE_INTERVAL_MS = 4000
/** 广告轮播间隔（毫秒） */
const AD_INTERVAL_MS = 5000

/** 公告轮播定时器（普通变量，不需要响应式） */
let announceTimer: ReturnType<typeof setInterval> | undefined
/** 广告轮播定时器（普通变量，不需要响应式） */
let adTimer: ReturnType<typeof setInterval> | undefined
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

function startAdTicker() {
  stopAdTicker()
  if (inlineAdverts.value.length <= 1) return
  adTimer = setInterval(() => {
    currentAdIndex.value = (currentAdIndex.value + 1) % inlineAdverts.value.length
  }, AD_INTERVAL_MS)
}

function stopAdTicker() {
  if (adTimer) clearInterval(adTimer)
  adTimer = undefined
}
onMounted(() => {
  startAnnounceTicker()
  startAdTicker()
  maybeStartWelcomeTour()
})
onBeforeUnmount(() => {
  stopAnnounceTicker()
  stopAdTicker()
  clearWelcomeTourTimer()
})
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
// 必须在 onMounted（hydration 完成后）再拉取，不能放 setup 阶段：
// import.meta.client 在 setup 里发起、本地 API 又极快，数据会在 hydration 完成前就位，
// 造成 SSR（空列表）与客户端（有数据）DOM 子节点数不一致 → replaceChild hydration 报错整页挂掉。
onMounted(() => {
  getHotPosts()
    .then((posts) => { hotPosts.value = posts })
    .catch(() => {})
  getLatestUsers(8)
    .then((users) => { newUsers.value = users })
    .catch(() => {})
})

watch(
  () => inlineAdverts.value.length,
  () => {
    currentAdIndex.value = 0
    startAdTicker()
  }
)

// 应用启动时恢复登录状态
if (import.meta.client) {
  restoreSession()
}

// ── 首次登录 welcome 引导（单一时钟，onBeforeUnmount 清理）──
// 触发条件：已登录 + 未完成过 welcome。单一入口函数同时覆盖「进入时已登录」与「进入后登录」，
// 延迟等 DOM 完全渲染且引导标记元素挂载后再弹，避免两处重复调度。
/** welcome 引导弹出延迟（毫秒）：让用户先适应登录后的界面，也确保引导目标元素已挂载 */
const WELCOME_TOUR_DELAY_MS = 2000
let welcomeTimer: ReturnType<typeof setTimeout> | undefined
function clearWelcomeTourTimer() {
  if (welcomeTimer) clearTimeout(welcomeTimer)
  welcomeTimer = undefined
}
function maybeStartWelcomeTour() {
  if (import.meta.server || !isLoggedIn.value || isCompleted('welcome')) return
  clearWelcomeTourTimer()
  welcomeTimer = setTimeout(() => {
    welcomeTimer = undefined
    if (isCompleted('welcome')) return
    startWelcomeTour()
  }, WELCOME_TOUR_DELAY_MS)
}
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) maybeStartWelcomeTour()
})

/** 点击板块：拼 URL 跳回首页。slug 为空串 = 全部（移除 category），其余均为真实分类 slug 直接过滤 */
function handleSelectCategory(slug: string) {
  const query = { ...route.query } as Record<string, string>
  if (slug === '') delete query.category
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
