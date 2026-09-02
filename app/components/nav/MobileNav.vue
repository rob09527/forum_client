<template>
  <!-- 移动端底部 tab 导航（lg:hidden，仅 <1024px 显示）。
       5 槽：首页 / 分类 / [发帖 ➕] / 商店 / 我的；发帖为居中圆钮（论坛第一优先级动作），只显 ➕ 不显文字。
       商店：积分商城入口，购买装扮/称号/头像框等。
       pb 适配 iOS Home 条安全区；固定底栏，主内容区由 default.vue 加对应底部内边距避让。
       不加 backdrop-blur：固定整宽栏滚动时对背后内容逐帧重算模糊，bg-white/95 下几乎不可见，纯耗电/掉帧。 -->
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-zinc-200 pb-[env(safe-area-inset-bottom)]"
    aria-label="移动端主导航"
  >
    <div class="grid grid-cols-5 items-stretch h-14">
      <NuxtLink to="/" data-onboarding="nav-home" class="nav-tab justify-center" :class="navClass('/')">
        <AppIcon name="home" :size="20" />
        <span>首页</span>
      </NuxtLink>

      <NuxtLink to="/categories" data-onboarding="nav-categories" class="nav-tab justify-center" :class="navClass('/categories')">
        <AppIcon name="grid" :size="20" />
        <span>分类</span>
      </NuxtLink>

      <!-- 发帖 FAB：圆钮与其余 tab 同一水平线垂直居中（整改：原凸起设计圆心比 tab 图标高约 22px，入口不平行；去掉 absolute 抬高改为 justify-center） -->
      <NuxtLink
        to="/post/new"
        data-onboarding="nav-post"
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
        to="/shop"
        data-onboarding="nav-shop"
        class="nav-tab justify-center"
        :class="navClass('/shop')"
        aria-label="商店"
      >
        <AppIcon name="shopping-cart" :size="20" />
        <span>商店</span>
      </NuxtLink>

      <button data-onboarding="nav-user" class="nav-tab justify-center" :class="navClass('/me')" @click="handleMe">
        <AppIcon name="user" :size="20" />
        <span>我的</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const { user, openLogin } = useAuth()

/** 判断当前路由是否命中某个 tab（「/」精确匹配首页，「/me」聚合个人域下若干页面） */
function isActive(prefix: string): boolean {
  const p = route.path
  if (prefix === '/') return p === '/'
  if (prefix === '/categories') return p === '/categories'
  if (prefix === '/me') {
    // 个人主页(/user/:id)、我的内容(/my/*)、积分流水(/me/points)都归入「我的」；
    // 私信页(/messages)、通知页(/notifications)不归入，通过顶栏访问
    return p.startsWith('/user') || p.startsWith('/my') || p.startsWith('/me') || p === '/following'
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
