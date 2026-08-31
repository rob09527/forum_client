/**
 * 响应式布局状态管理。
 * Nuxt 自动导入，任意组件可直接调用 useAppLayout()。
 * 命名为 useAppLayout 以避免与 Nuxt 内置的 useLayout 冲突。
 */
// 抽屉开关提升到模块级单例：顶栏汉堡与抽屉组件各自调用 useAppLayout()，
// 若 ref 建在函数内，每次调用都会新建一个独立的 ref，汉堡 toggle 的和抽屉读的不是同一份，
// 导致手机上点击汉堡「没反应」。模块级 ref 全站共享同一状态。
const leftDrawerOpen = ref(false)

export function useAppLayout() {
  const isMobile = useMediaQuery('(max-width: 1023px)')

  function toggleLeftDrawer() {
    leftDrawerOpen.value = !leftDrawerOpen.value
  }

  return { isMobile, leftDrawerOpen, toggleLeftDrawer }
}
