import { useApiBase } from './api'

/**
 * 实时推送（SSE）统一单流客户端。
 *
 * 后端已把「通知」与「私信」收敛到同一条 /api/me/stream，本 composable 用
 * 一个 EventSource 连接承载两种事件，各业务 composable（useNotifications / useMessages）
 * 通过 subscribe 订阅自己的事件类型，避免历史方案里的多流多连接。
 *
 * 连接是「进程内单例」：无论多少个组件调用 useRealtime()，共享同一个 EventSource
 * 与 handler 注册表；连接生命周期由持久组件（AppHeader）显式 start()/stop() 托管。
 *
 * 断线补拉：EventSource 断线自动重连，每次（重）连成功触发 open 事件；
 * 首次 open 由 onMounted 的主动拉取覆盖，跳过；之后的 open 视为重连，调用各业务
 * 注册的 onReconnect 补拉未读数 / 活跃会话消息，弥补断线期间的漏推送（及时性兜底）。
 */

export type RealtimeEvent = 'notification' | 'dm'

type Handler = (payload: Record<string, unknown>) => void

interface Realtime {
  start(): void
  stop(): void
  subscribe(event: RealtimeEvent, handler: Handler): () => void
  onReconnect(handler: () => void): () => void
}

let instance: Realtime | null = null

export function useRealtime(): Realtime {
  if (instance) return instance

  const apiBase = useApiBase()
  const { isLoggedIn } = useAuth()

  let source: EventSource | null = null
  let openedOnce = false
  const handlers = new Map<RealtimeEvent, Set<Handler>>()
  const reconnectHandlers = new Set<() => void>()

  function dispatch(event: RealtimeEvent, e: Event): void {
    try {
      const payload = JSON.parse((e as MessageEvent).data) as Record<string, unknown>
      handlers.get(event)?.forEach((h) => h(payload))
    } catch {
      // 心跳注释行无 data，不触发；解析失败忽略
    }
  }

  function start(): void {
    // 仅客户端 + 已登录 + 未建连
    if (import.meta.server || !isLoggedIn.value || source) return

    source = new EventSource(`${apiBase.value}/api/me/stream`)
    source.addEventListener('notification', (e) => dispatch('notification', e))
    source.addEventListener('dm', (e) => dispatch('dm', e))

    // 断线重连补拉：open 每次（重）连成功触发；首连跳过（onMounted 已主动拉取）
    source.addEventListener('open', () => {
      if (!openedOnce) {
        openedOnce = true
        return
      }
      reconnectHandlers.forEach((h) => h())
    })
    // EventSource 断线自动重连，无需处理 onerror
  }

  function stop(): void {
    source?.close()
    source = null
    openedOnce = false
  }

  function subscribe(event: RealtimeEvent, handler: Handler): () => void {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(handler)
    return () => {
      handlers.get(event)?.delete(handler)
    }
  }

  function onReconnect(handler: () => void): () => void {
    reconnectHandlers.add(handler)
    return () => {
      reconnectHandlers.delete(handler)
    }
  }

  instance = { start, stop, subscribe, onReconnect }
  return instance
}
