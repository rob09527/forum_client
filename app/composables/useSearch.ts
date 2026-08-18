import type { ApiResponse, Paginated, PostListItem } from '~/types'
import { useApiBase, extractErrorMessage } from './api'

/** 搜索查询参数 */
export interface SearchQuery {
  /** 搜索关键词 */
  q: string
  /** 板块筛选 */
  category?: string
  page?: number
  pageSize?: number
}

/**
 * 帖子全文搜索（后端走 MeiliSearch，返回与帖子列表一致的 Paginated<PostListItem>）。
 * 结果用 useSearch() 里的响应式状态 + search() 触发。
 */
export function useSearch() {
  const apiBase = useApiBase()

  // ── 结果状态 ──
  const results = ref<PostListItem[]>([])
  const total = ref(0)
  const totalPages = ref(0)
  const loading = ref(false)
  const error = ref('')

  /**
   * 执行搜索（分页由服务端处理）。
   * 返回本次数据，供 useAsyncData 序列化（避免 handler 返回 undefined 触发客户端重复请求）。
   */
  async function search(query: SearchQuery): Promise<Paginated<PostListItem>> {
    loading.value = true
    error.value = ''
    try {
      const res = await $fetch<ApiResponse<Paginated<PostListItem>>>(
        `${apiBase.value}/api/search`,
        { query }
      )
      results.value = res.data.items
      total.value = res.data.total
      totalPages.value = res.data.totalPages
      return res.data
    } catch (err: any) {
      error.value = extractErrorMessage(err, '搜索失败')
      // 出错也返回空分页，让 useAsyncData handler 有确定返回值
      return { items: [], page: query.page ?? 1, pageSize: 0, total: 0, totalPages: 0 }
    } finally {
      loading.value = false
    }
  }

  return {
    results,
    total,
    totalPages,
    loading,
    error,
    search,
  }
}
