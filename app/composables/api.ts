import type { ApiResponse } from '~/types'

/**
 * 请求基础地址。
 * SSR 时 Nitro devProxy 不代理内部 $fetch，需要完整 URL 直连后端；
 * 客户端浏览器走 devProxy（同源 /api），用空字符串即可。
 */
export function useApiBase() {
  const config = useRuntimeConfig()
  return computed(() => (import.meta.server ? (config.apiBase as string) : ''))
}

/** 从 fetch 异常中提取用户可读的错误消息（后端统一 { error: { message } } 格式） */
export function extractErrorMessage(err: any, fallback = '操作失败，请重试'): string {
  // Fastify 返回的 { success: false, error: { code, message } }
  if (err?.data?.error?.message) {
    return err.data.error.message
  }
  if (err?.data?.message) {
    return err.data.message
  }
  // 网络 / ofetch 错误
  if (err?.message && err.message !== 'Failed to fetch') {
    return err.message
  }
  return fallback
}

/** 解析统一响应包装，非 success 时抛错 */
export function unwrap<T>(res: ApiResponse<T>): T {
  if (!res || res.success === false) {
    throw new Error(res?.error?.message || '请求失败')
  }
  return res.data
}
