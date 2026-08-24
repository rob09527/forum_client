import type { ApiResponse, NotificationItem, Paginated } from '~/types'
import { useApiBase } from './api'

/**
 * 站内通知。
 * 未读数 + 列表 + 已读操作；initStream 建立 SSE 长连接实时更新未读数。
 * SSE 生命周期：登录后创建、退出/卸载时关闭（EventSource 断线自动重连，无需手动处理）。
 */
export function useNotifications() {
  const apiBase = useApiBase()
  const { isLoggedIn } = useAuth()

  /**
   * 未读数（顶栏红点）。用 useState 按 key 共享：AppHeader 与 notifications.vue
   * 各自调用 useNotifications() 时读到的都是同一份——页面 markAllRead/markRead
   * 后顶栏红点立即消失，无需刷新（此前各组件持有独立 ref 导致红点滞后）。
   */
  const unread = useState<number>('notifications-unread', () => 0)
  const items = ref<NotificationItem[]>([])
  const totalPages = ref(0)
  const loading = ref(false)

  let source: EventSource | null = null
  /** 收到新通知时的回调（调用方用于 toast 提示） */
  let onNew: ((n: NotificationItem | null) => void) | null = null

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
   * 建立 SSE 长连接（仅登录 + 客户端执行）。
   * cb 在收到新通知时回调（事件 payload 不带完整通知详情，仅 { notification, unreadCount } 或 { type:'system' }）。
   */
  function initStream(cb?: (n: NotificationItem | null) => void): void {
    onNew = cb ?? null
    // SSR 阶段无 EventSource；未登录不建连（登出时 stopStream 清理）
    if (import.meta.server || !isLoggedIn.value || source) return

    source = new EventSource(`${apiBase.value}/api/me/notifications/stream`)
    source.addEventListener('notification', (e) => {
      try {
        const payload = JSON.parse((e as MessageEvent).data)
        if (typeof payload.unreadCount === 'number') {
          unread.value = payload.unreadCount
        }
        onNew?.(payload.notification ?? null)
      } catch {
        // 解析失败忽略（心跳注释行无 data 不会触发此事件）
      }
    })
    // EventSource 断线自动重连，无需处理 onerror
  }

  function stopStream(): void {
    source?.close()
    source = null
    onNew = null
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
    initStream,
    stopStream,
  }
}
