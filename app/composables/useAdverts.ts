import type { Advert, ApiResponse } from '~/types'
import { useApiBase } from './api'

/**
 * 广告相关操作（前台各广告位只读）。
 * 增删改由 Cool Admin 后台管理，业务侧只拉取上线广告。
 * 内部用 useAsyncData('adverts') 按 key 去重，多个组件（侧边栏/列表内嵌）共享同一份数据。
 */
export function useAdverts() {
  const apiBase = useApiBase()

  /** 获取上线广告列表（已按 sortOrder 倒序） */
  async function getAdverts(): Promise<Advert[]> {
    const res = await $fetch<ApiResponse<Advert[]>>(`${apiBase.value}/api/adverts`)
    return res.data
  }

  const { data: adverts } = useAsyncData<Advert[]>('adverts', () => getAdverts(), {
    default: () => [],
  })

  return { adverts }
}
