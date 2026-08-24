import type { ApiResponse, UserSummary } from '~/types'
import { useApiBase } from './api'

/**
 * 用户搜索（@提及候选）。
 * 仅客户端编辑器自动补全调用；返回 { id, username, avatar, level }。
 */
export function useUserSearch() {
  const apiBase = useApiBase()

  /**
   * 按用户名前缀搜索 active 用户。
   * 空关键词返回空数组（避免无谓请求）。
   */
  async function searchUsers(q: string): Promise<UserSummary[]> {
    const keyword = q.trim()
    if (keyword.length === 0) {
      return []
    }
    const res = await $fetch<ApiResponse<UserSummary[]>>(
      `${apiBase.value}/api/users/search`,
      { query: { q: keyword } }
    )
    return res.data ?? []
  }

  return { searchUsers }
}
