import type { ApiResponse, CheckinResult, CheckinStatus } from '~/types'
import { useApiBase } from './api'

/**
 * 签到相关操作：状态查询 + 执行签到。
 * 两个接口都需登录，未登录时后端返回 401（前端用 useAuth 拦截跳登录）。
 */
export function useCheckin() {
  const apiBase = useApiBase()

  /** 查询签到状态（需登录），month 格式 YYYY-MM，缺省当月 */
  async function getStatus(month?: string): Promise<CheckinStatus> {
    const res = await $fetch<ApiResponse<CheckinStatus>>(
      `${apiBase.value}/api/checkin/status`,
      { query: month ? { month } : undefined }
    )
    return res.data
  }

  /** 执行签到（需登录），返回本次所得鸡腿与连续天数 */
  async function checkin(): Promise<CheckinResult> {
    const res = await $fetch<ApiResponse<CheckinResult>>(
      `${apiBase.value}/api/checkin`,
      { method: 'POST' }
    )
    return res.data
  }

  return { getStatus, checkin }
}
