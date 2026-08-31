<template>
  <!-- 移动端底部 tab 导航（lg:hidden，仅 <1024px 显示）。
       5 槽：首页 / 商店 / [发帖 ➕] / 消息 / 我的；发帖为居中圆钮（论坛第一优先级动作），只显 ➕ 不显文字。
       消息=私信(/messages)：顶栏铃铛(通知)手机端已常驻，私信没有固定入口，故「消息」tab 指私信。
       pb 适配 iOS Home 条安全区；固定底栏，主内容区由 default.vue 加对应底部内边距避让。
       不加 backdrop-blur：固定整宽栏滚动时对背后内容逐帧重算模糊，bg-white/95 下几乎不可见，纯耗电/掉帧。 -->
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-zinc-200 pb-[env(safe-area-inset-bottom)]"
    aria-label="移动端主导航"
  >
    <div class="grid grid-cols-5 items-stretch h-14">
      <NuxtLink to="/" class="nav-tab justify-center" :class="navClass('/')">
        <AppIcon name="home" :size="20" />
        <span>首页</span>
      </NuxtLink>

      <NuxtLink to="/shop" class="nav-tab justify-center" :class="navClass('/shop')">
        <AppIcon name="shopping-cart" :size="20" />
        <span>商店</span>
      </NuxtLink>

      <!-- 发帖 FAB：圆钮与其余 tab 同一水平线垂直居中（整改：原凸起设计圆心比 tab 图标高约 22px，入口不平行；去掉 absolute 抬高改为 justify-center） -->
      <NuxtLink
        to="/post/new"
        class="nav-tab justify-center"
        :class="navClass('/post/new')"
        aria-label="发帖"
      >
        <span
          class="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
          aria-hidden="true"
        >
          <AppIcon name="plus" :size="22" />
        </span>
      </NuxtLink>

      <NuxtLink
        to="/messages"
        class="nav-tab justify-center"
        :class="navClass('/messages')"
        aria-label="消息（私信）"
      >
        <span class="relative">
          <AppIcon name="message-square" :size="20" />
          <!-- 私信未读红点：与顶栏信封共用 useMessages().unread 全局单例（SSE 实时推送同一份数据） -->
          <span
            v-if="dmUnread > 0"
            class="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center"
          >
            {{ dmUnread > 99 ? '99+' : dmUnread }}
          </span>
        </span>
        <span>消息</span>
      </NuxtLink>

      <button class="nav-tab justify-center" :class="navClass('/me')" @click="handleMe">
        <AppIcon name="user" :size="20" />
        <span>我的</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const { user, openLogin } = useAuth()
// 私信未读总数：与 AppHeader 顶栏信封共用同一 useState('dm-unread') 单例，
// 初始拉取与 SSE 订阅由 AppHeader onMounted 统一负责，这里只读不写。
const { unread: dmUnread } = useMessages()

/** 判断当前路由是否命中某个 tab（「/」精确匹配首页，「/me」聚合个人域下若干页面） */
function isActive(prefix: string): boolean {
  const p = route.path
  if (prefix === '/') return p === '/'
  if (prefix === '/me') {
    // 私信页(/messages)已独立为「消息」tab，不再归入「我的」
    return p.startsWith('/user') || p.startsWith('/my') || p === '/following'
  }
  return p.startsWith(prefix)
}

/** tab 基类 + 命中态配色（未命中灰、命中蓝，复用主色 token 语义） */
function navClass(prefix: string): string {
  return isActive(prefix) ? 'text-blue-600' : 'text-zinc-500'
}

/** 「我的」：已登录跳个人主页，未登录唤起登录弹窗 */
function handleMe() {
  if (user.value) navigateTo(`/user/${user.value.id}`)
  else openLogin()
}
</script>

<style scoped>
/* tab 基类：纵向图标+文字，字号统一 10px。
   不用 @apply：Tailwind v4 的 scoped style 里 @apply 会因缺 @reference 报「未知工具类」，
   且全库 Vue 无 scoped @apply 先例，这里写等价原生 CSS（gap-0.5 = 2px）。 */
.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  font-size: 10px;
  line-height: 1;
  transition: color 150ms, background-color 150ms, border-color 150ms;
}
/* justify-content 不放基类：scoped 基类特异性高于单类工具，会压掉 FAB 项的 justify-end */

</style>
