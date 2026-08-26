import type { ApiResponse, NotificationItem, Paginated } from '~/types'
import { useApiBase } from './api'
import { useRealtime } from './useRealtime'

/**
 * 站内通知。
 * 未读数 + 列表 + 已读操作；实时推送由 useRealtime 统一单流承载。
 * setupRealtime 订阅 notification 事件 + 断线补拉未读数（幂等：进程内只注册一次）。
 */
export function useNotifications() {
  const apiBase = useApiBase()
  const { isLoggedIn } = useAuth()
  const realtime = useRealtime()
  const toast = useToast()

  /**
   * 未读数（顶栏红点）。用 useState 按 key 共享：AppHeader 与 notifications.vue
   * 各自调用 useNotifications() 时读到的都是同一份——页面 markAllRead/markRead
   * 后顶栏红点立即消失，无需刷新（此前各组件持有独立 ref 导致红点滞后）。
   */
  const unread = useState<number>('notifications-unread', () => 0)
  const items = ref<NotificationItem[]>([])
  const totalPages = ref(0)
  const loading = ref(false)

  async function fetchUnread(): Promise<void> {
    if (!isLoggedIn.value) {
      unread.value = 0
      return
    }
    try {
      const res = await $fetch<ApiResponse<{ count: number }>>(
        `${apiBase.value}/api/me/notifications/unread-count`
      )
      unread.value = res.data.count
    } catch {
      // 未读数是增强信息，失败静默（保持上次值）
    }
  }

  async function loadNotifications(page = 1, pageSize = 20): Promise<void> {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Paginated<NotificationItem>>>(
        `${apiBase.value}/api/me/notifications`,
        { query: { page, pageSize } }
      )
      items.value = res.data.items
      totalPages.value = res.data.totalPages
    } finally {
      loading.value = false
    }
  }

  async function markAllRead(): Promise<void> {
    await $fetch<ApiResponse<{ updated: number }>>(
      `${apiBase.value}/api/me/notifications/read-all`,
      { method: 'POST' }
    )
    unread.value = 0
    items.value = items.value.map((n) => ({ ...n, isRead: true }))
  }

  async function markRead(id: number): Promise<void> {
    await $fetch<ApiResponse<null>>(
      `${apiBase.value}/api/me/notifications/${id}/read`,
      { method: 'POST' }
    )
    const target = items.value.find((n) => n.id === id)
    if (target && !target.isRead) {
      target.isRead = true
      unread.value = Math.max(0, unread.value - 1)
    }
  }

  /**
   * 订阅实时通知 + 断线补拉（幂等，进程内只注册一次）。
   * payload 形态：{ notification, unreadCount }（业务通知）或 { type:'system' }（系统群发，不带未读数）。
   */
  function setupRealtime(): void {
    if (realtimeRegistered) return
    realtimeRegistered = true

    realtime.subscribe('notification', (payload) => {
      if (typeof payload.unreadCount === 'number') {
        unread.value = payload.unreadCount
      } else {
        // 系统群发不带未读数，兜底重拉
        fetchUnread()
      }
      toast.add({ title: '收到新通知', color: 'info', duration: 3000 })
    })
    realtime.onReconnect(() => {
      fetchUnread()
    })
  }

  return {
    unread,
    items,
    totalPages,
    loading,
    fetchUnread,
    loadNotifications,
    markAllRead,
    markRead,
    setupRealtime,
  }
}

/** 进程内注册标记：setupRealtime 只注册一次，避免多组件重复订阅 */
let realtimeRegistered = false
