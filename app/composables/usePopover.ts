/**
 * 编辑器工具栏按钮的弹出层定位逻辑(Teleport 到 body,fixed 相对视口)。
 * 色板、表情面板共用:打开时贴按钮下方,空间不足自动翻转到上方,
 * 左右贴边防溢出;页面滚动时自动收起,避免面板悬挂。
 */
export function usePopover(panelW: number, panelH: number) {
  const btnRef = ref<HTMLButtonElement | null>(null)
  const show = ref(false)
  const pos = ref({ top: '0px', left: '0px' })

  function open() {
    const el = btnRef.value
    if (!el) return
    const r = el.getBoundingClientRect()
    let left = r.left
    let top = r.bottom + 6
    if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8
    if (left < 8) left = 8
    if (top + panelH > window.innerHeight - 8) top = Math.max(8, r.top - panelH - 6)
    pos.value = { top: `${top}px`, left: `${left}px` }
    show.value = true
  }

  function close() {
    show.value = false
  }

  function toggle() {
    if (show.value) close()
    else open()
  }

  // 滚动时收起,避免面板悬挂
  onMounted(() => window.addEventListener('scroll', close, true))
  onBeforeUnmount(() => window.removeEventListener('scroll', close, true))

  return { btnRef, show, pos, open, close, toggle }
}
