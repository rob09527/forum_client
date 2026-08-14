import type { ApiResponse, NewUser, Paginated, PointLogItem, UserProfile } from '~/types'
import { useApiBase } from './api'

/**
 * 用户资料 + 积分流水查询。
 * 访问要求：getLatestUsers / updateAvatar 公开（后者的写需登录）；
 * getProfile / getPointsLog 需登录（产品决策，见后端 authenticate），
 * 且 getPointsLog 仅本人可见，调用方需在登录态下使用。
 */
export function useUserProfile() {
  const apiBase = useApiBase()

  /** 查询公开用户资料 */
  async function getProfile(id: number): Promise<UserProfile> {
    const res = await $fetch<ApiResponse<UserProfile>>(`${apiBase.value}/api/user/${id}/profile`)
    return res.data
  }

  /** 最新注册用户 Top N（默认 8，侧边栏「欢迎新用户」） */
  async function getLatestUsers(limit = 8): Promise<NewUser[]> {
    const res = await $fetch<ApiResponse<NewUser[]>>(
      `${apiBase.value}/api/users/latest`,
      { query: { limit } }
    )
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

  /** 更新当前用户头像为本地预置头像，返回新的头像路径 */
  async function updateAvatar(avatar: string): Promise<string> {
    const res = await $fetch<ApiResponse<{ avatar: string }>>(
      `${apiBase.value}/api/user/me/avatar`,
      { method: 'PUT', body: { avatar } }
    )
    return res.data.avatar
  }

  return { getProfile, getLatestUsers, getPointsLog, updateAvatar }
}
