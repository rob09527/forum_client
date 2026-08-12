import type { ApiResponse, Paginated, PointLogItem, UserProfile } from '~/types'
import { useApiBase } from './api'

/**
 * 用户公开资料 + 积分流水查询。
 * 两个接口都公开，无需登录即可查看。
 */
export function useUserProfile() {
  const apiBase = useApiBase()

  /** 查询公开用户资料 */
  async function getProfile(id: number): Promise<UserProfile> {
    const res = await $fetch<ApiResponse<UserProfile>>(`${apiBase.value}/api/user/${id}/profile`)
    return res.data
  }

  /** 分页查询积分流水 */
  async function getPointsLog(id: number, page = 1, pageSize = 20): Promise<Paginated<PointLogItem>> {
    const res = await $fetch<ApiResponse<Paginated<PointLogItem>>>(
      `${apiBase.value}/api/user/${id}/points-log`,
      { query: { page, pageSize } }
    )
    return res.data
  }

  return { getProfile, getPointsLog }
}
