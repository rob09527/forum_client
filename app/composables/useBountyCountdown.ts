import { useIntervalFn } from '@vueuse/core'

/**
 * 悬赏详情倒计时（设计文档 3.5）：托管中横幅的剩余时间文案，到 0 后 `expired=true`，
 * 调用方 watch 到 expired 后拉一次详情刷新状态（后端超时结算后 status 变 settled）。
 *
 * SSR 安全：useIntervalFn 仅在客户端起定时器，SSR 渲染时 now 恒为初始值。
 */
export function useBountyCountdown(expireAt: () => string | null | undefined) {
  const now = ref(Date.now())
  const { pause, resume } = useIntervalFn(
    () => {
      now.value = Date.now()
    },
    1000,
    { immediate: false }
  )

  // 有到期时间才开始倒计时（无悬赏/已结算无需计时）
  onMounted(() => {
    if (expireAt()) resume()
  })
  onBeforeUnmount(pause)

  /** 剩余毫秒（已过期为 0） */
  const remainingMs = computed(() => {
    const t = expireAt()
    if (!t) return 0
    return Math.max(0, new Date(t).getTime() - now.value)
  })

  /** 是否已到结算时间（0 即触发详情刷新） */
  const expired = computed(() => remainingMs.value <= 0)

  /** 文案：≥1 天 "N天 HH:MM:SS"；<1 天 "HH:MM:SS"；已过期 "已到期" */
  const text = computed(() => {
    if (expired.value) return '已到期'
    const total = Math.floor(remainingMs.value / 1000)
    const d = Math.floor(total / 86400)
    const h = Math.floor((total % 86400) / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n: number) => String(n).padStart(2, '0')
    return d > 0 ? `${d}天 ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`
  })

  return { expired, text, remainingMs }
}
