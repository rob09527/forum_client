/**
 * 响应式布局状态管理。
 * Nuxt 自动导入，任意组件可直接调用 useAppLayout()。
 * 命名为 useAppLayout 以避免与 Nuxt 内置的 useLayout 冲突。
 */
export function useAppLayout() {
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const leftDrawerOpen = ref(false)

  function toggleLeftDrawer() {
    leftDrawerOpen.value = !leftDrawerOpen.value
  }

  return { isMobile, leftDrawerOpen, toggleLeftDrawer }
}
