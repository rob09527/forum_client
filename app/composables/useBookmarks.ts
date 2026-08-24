import type { ApiResponse, BookmarkItem, Paginated } from '~/types'
import { useApiBase } from './api'

/**
 * 帖子收藏（私密，仅本人可见）。
 * 收藏/取消为一次性操作；收藏列表用响应式状态（我的收藏页共用）。
 */
export function useBookmarks() {
  const apiBase = useApiBase()

  /** 收藏帖子 */
  async function bookmarkPost(id: number): Promise<void> {
    await $fetch<ApiResponse<{ id: number }>>(
      `${apiBase.value}/api/posts/${id}/bookmark`,
      { method: 'POST' }
    )
  }

  /** 取消收藏 */
  async function unbookmarkPost(id: number): Promise<void> {
    await $fetch<ApiResponse<null>>(
      `${apiBase.value}/api/posts/${id}/bookmark`,
      { method: 'DELETE' }
    )
  }

  /** 收藏/取消切换（返回切换后的收藏态） */
  async function toggleBookmark(id: number, current: boolean): Promise<boolean> {
    if (current) {
      await unbookmarkPost(id)
      return false
    }
    await bookmarkPost(id)
    return true
  }

  // ── 收藏列表状态（我的收藏页） ──
  const items = ref<BookmarkItem[]>([])
  const total = ref(0)
  const totalPages = ref(0)
  const loading = ref(false)

  async function loadBookmarks(page = 1, pageSize = 20): Promise<Paginated<BookmarkItem> | null> {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Paginated<BookmarkItem>>>(
        `${apiBase.value}/api/me/bookmarks`,
        { query: { page, pageSize } }
      )
      items.value = res.data.items
      total.value = res.data.total
      totalPages.value = res.data.totalPages
      return res.data
    } catch {
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    bookmarkPost,
    unbookmarkPost,
    toggleBookmark,
    items,
    total,
    totalPages,
    loading,
    loadBookmarks,
  }
}
