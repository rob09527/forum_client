import type { ApiResponse, ConversationSummary, Message, Paginated } from '~/types'
import { useApiBase } from './api'
import { useRealtime } from './useRealtime'

/**
 * 用户私信（1v1 会话化）。
 *
 * 共享状态用 useState 按 key 共享（跨组件同源）：顶栏红点 unread、会话列表 conversations、
 * 当前活跃会话 activeConversationId 与其消息 messages。这样 /messages 双栏页与浮动 ChatDrawer
 * 读的是同一份数据，任一处打开会话、收发消息，另一处即时同步。
 *
 * 实时推送由 useRealtime 统一单流承载，setupRealtime 订阅 dm 事件 + 断线补拉。
 * 发消息走正常 HTTP（POST 返回落库结果），SSE 只负责「推给接收方」，不反向回显自己的消息（避免双写）。
 */
export function useMessages() {
  const apiBase = useApiBase()
  const { isLoggedIn, user } = useAuth()
  const realtime = useRealtime()
  const toast = useToast()
  const myId = computed(() => user.value?.id ?? -1)

  const unread = useState<number>('dm-unread', () => 0)
  const conversations = useState<ConversationSummary[]>('dm-conversations', () => [])
  const activeConversationId = useState<number | null>('dm-active-conversation', () => null)
  const messages = useState<Message[]>('dm-messages', () => [])
  const loading = useState<boolean>('dm-loading', () => false)
  /** 浮动聊天窗（ChatDrawer）是否展开（全局，任意页可唤起） */
  const drawerOpen = useState<boolean>('dm-drawer-open', () => false)

  /** 拉取未读私信总数（顶栏红点） */
  async function fetchUnread(): Promise<void> {
    if (!isLoggedIn.value) {
      unread.value = 0
      return
    }
    try {
      const res = await $fetch<ApiResponse<{ count: number }>>(
        `${apiBase.value}/api/me/conversations/unread-count`
      )
      unread.value = res.data.count
    } catch (err) {
      // 未读数是增强信息，失败不打扰用户，仅留痕便于排查
      console.warn('[dm] 拉取未读数失败', err)
    }
  }

  /** 拉取会话列表（单页最多 50，够 v1 用；翻页留作后续） */
  async function loadConversations(): Promise<void> {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Paginated<ConversationSummary>>>(
        `${apiBase.value}/api/me/conversations`,
        { query: { page: 1, pageSize: 50 } }
      )
      conversations.value = res.data.items
    } finally {
      loading.value = false
    }
  }

  /**
   * 建立/获取与某用户的会话（首次应用对方隐私门槛）。
   * 成功则把会话置顶到列表并设为当前会话，返回会话摘要。
   */
  async function openOrCreateConversation(otherUserId: number): Promise<ConversationSummary> {
    const res = await $fetch<ApiResponse<ConversationSummary>>(
      `${apiBase.value}/api/me/conversations`,
      { method: 'POST', body: { userId: otherUserId } }
    )
    const conv = res.data
    conversations.value = [conv, ...conversations.value.filter((c) => c.id !== conv.id)]
    activeConversationId.value = conv.id
    return conv
  }

  /** 选中会话：加载消息 + 标记已读 */
  async function selectConversation(id: number): Promise<void> {
    activeConversationId.value = id
    await loadMessages(id)
    await markRead(id)
  }

  /** 加载会话消息（beforeId 游标分页；不传取最新一页，传了则前插更早历史） */
  async function loadMessages(id: number, beforeId?: number): Promise<void> {
    const query: Record<string, number> = { pageSize: 30 }
    if (beforeId !== undefined) query.beforeId = beforeId
    const res = await $fetch<ApiResponse<Message[]>>(
      `${apiBase.value}/api/me/conversations/${id}/messages`,
      { query }
    )
    if (beforeId !== undefined) {
      messages.value = [...res.data, ...messages.value]
    } else {
      messages.value = res.data
    }
  }

  /** 向上加载更早的历史消息（仅当前会话） */
  async function loadOlder(): Promise<void> {
    const id = activeConversationId.value
    if (id === null || messages.value.length === 0) return
    const oldest = messages.value[0]
    if (!oldest) return
    await loadMessages(id, oldest.id)
  }

  /** 发送私信（HTTP 落库 + 本地追加 + 会话列表置顶/预览更新） */
  async function sendMessage(content: string): Promise<void> {
    const id = activeConversationId.value
    if (id === null) return
    const res = await $fetch<ApiResponse<Message>>(
      `${apiBase.value}/api/me/conversations/${id}/messages`,
      { method: 'POST', body: { content } }
    )
    messages.value = [...messages.value, res.data]
    bumpConversation(id, res.data.content)
  }

  /** 标记会话已读，返回最新未读总数并同步本地会话未读角标 */
  async function markRead(id: number): Promise<void> {
    const res = await $fetch<ApiResponse<{ unread: number }>>(
      `${apiBase.value}/api/me/conversations/${id}/read`,
      { method: 'POST' }
    )
    unread.value = res.data.unread
    const conv = conversations.value.find((c) => c.id === id)
    if (conv) conv.unreadCount = 0
  }

  /** 订阅实时私信 + 断线补拉（幂等，进程内只注册一次） */
  function setupRealtime(): void {
    if (realtimeRegistered) return
    realtimeRegistered = true

    realtime.subscribe('dm', (payload) => {
      if (typeof payload.unreadCount === 'number') {
        unread.value = payload.unreadCount
      }

      // 已读回执：对方读了我发的消息 → 本地把「我发的未读消息」标记为已读
      if (payload.type === 'read') {
        applyReadReceipt(payload)
        return
      }

      const convId = payload.conversationId as number | undefined
      const msg = payload.message as Message | undefined
      if (!convId || !msg) return

      if (activeConversationId.value === convId) {
        // 当前正在看的会话：直接上屏 + 标记已读
        if (!messages.value.some((m) => m.id === msg.id)) {
          messages.value = [...messages.value, msg]
        }
        markRead(convId).catch((err) => console.warn('[dm] 自动标记已读失败', err))
      } else {
        // 非当前会话：刷新列表（新消息置顶 + 预览/未读角标）+ 轻提示
        loadConversations().catch((err) => console.warn('[dm] 收到新消息后刷新会话列表失败', err))
        toast.add({ title: '收到新私信', color: 'info', duration: 3000 })
      }
    })

    realtime.onReconnect(() => {
      fetchUnread()
      if (activeConversationId.value !== null) {
        loadMessages(activeConversationId.value).catch((err) => console.warn('[dm] 断线补拉消息失败', err))
      }
    })
  }

  /** 处理「已读」回执：对方已读，把我发的、尚未读的消息标记为已读（对方已读时刻） */
  function applyReadReceipt(payload: { conversationId?: number; readAt?: string }): void {
    const convId = payload.conversationId
    const readAt = payload.readAt
    if (!convId || !readAt || activeConversationId.value !== convId) return
    messages.value = messages.value.map((m) =>
      m.senderId === myId.value && !m.readAt ? { ...m, readAt } : m
    )
  }

  /** 自己发完消息后，把该会话置顶 + 更新预览（本地即时反馈，不等 SSE） */
  function bumpConversation(id: number, preview: string): void {
    const conv = conversations.value.find((c) => c.id === id)
    if (!conv) return
    conv.lastMessagePreview = preview
    conv.lastMessageAt = new Date().toISOString()
    conv.unreadCount = 0
    conversations.value = [conv, ...conversations.value.filter((c) => c.id !== id)]
  }

  /** 关闭当前会话（清空活跃态与消息） */
  function closeConversation(): void {
    activeConversationId.value = null
    messages.value = []
  }

  /** 打开浮动聊天窗（显示当前活跃会话） */
  function openDrawer(): void {
    drawerOpen.value = true
  }

  /** 关闭浮动聊天窗（保留活跃会话，便于再次唤起） */
  function closeDrawer(): void {
    drawerOpen.value = false
  }

  /**
   * 从任意页发起/打开与某用户的会话并弹出浮动窗：
   * 建立会话 → 设为活跃 → 加载消息 → 标记已读 → 展开 ChatDrawer。
   */
  async function openChat(otherUserId: number): Promise<void> {
    const conv = await openOrCreateConversation(otherUserId)
    await loadMessages(conv.id)
    await markRead(conv.id)
    drawerOpen.value = true
  }

  return {
    unread,
    conversations,
    activeConversationId,
    messages,
    loading,
    drawerOpen,
    fetchUnread,
    loadConversations,
    openOrCreateConversation,
    selectConversation,
    loadMessages,
    loadOlder,
    sendMessage,
    markRead,
    closeConversation,
    openDrawer,
    closeDrawer,
    openChat,
    setupRealtime,
  }
}

/** 进程内注册标记：setupRealtime 只注册一次 */
let realtimeRegistered = false
