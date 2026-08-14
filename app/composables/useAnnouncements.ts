import type { Announcement, ApiResponse } from '~/types'
import { useApiBase } from './api'

/**
 * 公告相关操作（前台公告栏只读）。
 * 增删改由 Cool Admin 后台管理，业务侧只拉取上线公告。
 */
export function useAnnouncements() {
  const apiBase = useApiBase()

  /** 获取上线公告列表（已按 sortOrder 倒序） */
  async function getAnnouncements(): Promise<Announcement[]> {
    const res = await $fetch<ApiResponse<Announcement[]>>(`${apiBase.value}/api/announcements`)
    return res.data
  }

  return { getAnnouncements }
}
