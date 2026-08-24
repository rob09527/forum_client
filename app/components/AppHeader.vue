<template>
  <!-- 全宽毛玻璃导航栏：w-full 拉满视口；冷白底(white/75)与「冷白蜂巢」背景同系，
       blur-xl 透出顶部淡蓝光晕；底缘 1px 冷灰渐变细线衔接内容区（视觉方向 A，§7.12） -->
  <header class="sticky top-0 z-50 w-full bg-white/75 backdrop-blur-xl relative">
    <div class="px-4 lg:pl-[10vw] lg:pr-4">
    <!-- 底缘衔接线：冷灰渐变细线，替代暖金阴影，与背景光晕呼应 -->
    <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-slate-400/25 via-slate-400/10 to-transparent" aria-hidden="true" />
    <!-- Row 1: Logo + 搜索 + 用户 -->
    <div class="flex items-center h-12">
      <!-- Logo：负空间融合——无卡片无阴影，直接落在毛玻璃导航栏上，保持通透轻盈（千问 §7.13） -->
      <a href="/" class="flex items-center gap-2 whitespace-nowrap flex-shrink-0 lg:w-44 group">
        <!-- Logo 图形：蓝底圆角块 + 白色芯片方块 + 四角电路触点（算力/Base 底层语义） -->
        <svg width="26" height="26" viewBox="0 0 28 28" class="shrink-0 transition-transform group-hover:scale-[1.05]" aria-hidden="true">
          <rect width="28" height="28" rx="7" fill="#2563eb" />
          <rect x="8.5" y="8.5" width="11" height="11" rx="2" fill="none" stroke="#fff" stroke-width="1.6" />
          <rect x="11.7" y="11.7" width="4.6" height="4.6" rx="1" fill="#fff" />
          <g stroke="#fff" stroke-width="1.3" stroke-linecap="round">
            <path d="M14 3.4v4.4" /><path d="M14 20.2v4.4" />
            <path d="M3.4 14h4.4" /><path d="M20.2 14h4.4" />
            <path d="M8.5 5.8v2.7M5.8 8.5h2.7M19.5 5.8v2.7M22.2 8.5h-2.7" />
            <path d="M8.5 22.2v-2.7M5.8 19.5h2.7M19.5 22.2v-2.7M22.2 19.5h-2.7" />
          </g>
        </svg>
        <!-- 字标：整图展示（images/wordmark.svg，芯片电路连线方案2；文字已转 outline path，任意设备渲染一致） -->
        <img
          src="/images/wordmark.svg"
          alt="AI Base"
          width="98"
          height="26"
          class="h-[26px] w-auto shrink-0 transition-transform group-hover:scale-[1.03]"
        />
      </a>

      <!-- 搜索（左对齐帖子列表后，再整体右移 5%） -->
      <div class="relative flex-1 max-w-md ml-4 lg:ml-[calc(2rem+5%)]">
        <input
          v-model="searchText"
          type="text"
          placeholder="搜索帖子 / 用户"
          class="w-full h-8 pl-8 pr-3 text-sm bg-white border border-zinc-200 rounded-md
                 text-zinc-700 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                 transition-all"
          @keyup.enter="handleSearch"
        />
        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">🔍</span>
      </div>

      <!-- 用户区（靠右） -->
      <div class="ml-auto flex-shrink-0 flex items-center gap-2">
        <!-- 未登录：登录 + 注册 -->
        <template v-if="!isLoggedIn">
          <button
            class="px-3 py-1 text-sm text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            @click="openLogin"
          >
            登录
          </button>
          <!-- 二轮整改：注册按钮半透明化，与毛玻璃栏体材质同系，不再形成实色断点 -->
          <button
            class="px-3 py-1 text-sm bg-blue-500/85 hover:bg-blue-600/90 text-white rounded-md backdrop-blur-sm transition-colors"
            @click="openRegister"
          >
            注册
          </button>
        </template>
        <!-- 已登录 -->
        <template v-else>
          <!-- 通知铃铛 + 未读红点 → 通知中心 -->
          <NuxtLink
            to="/notifications"
            class="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-zinc-100 transition-colors"
            title="通知"
          >
            <span class="text-base leading-none">🔔</span>
            <span
              v-if="unread > 0"
              class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center"
            >
              {{ unread > 99 ? '99+' : unread }}
            </span>
          </NuxtLink>
          <div ref="dropdownRef" class="relative">
          <button class="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors text-left" @click="toggleDropdown">
            <Avatar :username="user?.username" :avatar="user?.avatar" size="sm" />
            <span class="text-sm text-zinc-700 hidden xl:inline max-w-[80px] truncate">{{ user?.username }}</span>
          </button>
          <!-- 下拉菜单 -->
          <Transition name="dropdown">
            <div
              v-if="showDropdown"
              class="absolute right-0 top-full mt-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden z-50"
            >
              <div class="px-4 py-3 border-b border-zinc-200">
                <p class="text-sm font-medium text-zinc-800 truncate">{{ user?.username }}</p>
                <p class="text-xs text-zinc-500 truncate">{{ user?.email }}</p>
              </div>
              <div class="py-1">
                <NuxtLink
                  :to="`/user/${user?.id}`"
                  class="w-full px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-left block"
                  @click="showDropdown = false"
                >
                  👤 个人主页
                </NuxtLink>
                <NuxtLink
                  to="/my/bookmarks"
                  class="w-full px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-left block"
                  @click="showDropdown = false"
                >
                  🔖 我的收藏
                </NuxtLink>
                <NuxtLink
                  to="/following"
                  class="w-full px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-left block"
                  @click="showDropdown = false"
                >
                  📡 关注动态
                </NuxtLink>
              </div>
              <div class="border-t border-zinc-200 py-1">
                <button
                  class="w-full px-4 py-2 text-sm text-zinc-600 hover:text-red-600 hover:bg-zinc-100 transition-colors text-left"
                  @click="handleLogout"
                >
                  🚪 退出
                </button>
              </div>
            </div>
          </Transition>
          </div>
        </template>
      </div>
    </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, isLoggedIn, logout, openLogin, openRegister } = useAuth()
const toast = useToast()
const { unread, fetchUnread, initStream, stopStream } = useNotifications()

const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 顶栏搜索：回车跳转 /search?q=…（当前仅搜索帖子，占位文案保留）
const searchText = ref('')

function handleSearch() {
  const q = searchText.value.trim()
  if (!q) return
  navigateTo({ path: '/search', query: { q } })
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

// 点击下拉外区域 / Esc 关闭（blur 事件不冒泡，原 @blur+setTimeout 方案不兜底外部点击）
function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}
function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') showDropdown.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEsc)
  // 通知：初始拉未读数；已登录则建立 SSE 长连接
  fetchUnread()
  initStream((_n) => {
    toast.add({ title: '收到新通知', color: 'info', duration: 3000 })
  })
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEsc)
  stopStream()
})

// 登录态变化：登录后建流，登出后清理并清零未读
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    fetchUnread()
    initStream((_n) => {
      toast.add({ title: '收到新通知', color: 'info', duration: 3000 })
    })
  } else {
    stopStream()
  }
})

async function handleLogout() {
  showDropdown.value = false
  await logout()
}

</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
