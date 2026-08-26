import type {
  ApiResponse,
  CommentItem,
  CommentTreeItem,
  Paginated,
} from '~/types'
import { useApiBase, extractErrorMessage } from './api'

/**
 * 评论相关操作。
 * 列表页用 loadComments + 响应式状态，其余操作为一次性的 async 函数（出错抛异常）。
 */
export function useComments() {
  const apiBase = useApiBase()

  // ── 评论列表状态 ──
  const comments = ref<CommentTreeItem[]>([])
  const loading = ref(false)
  const error = ref('')

  /** 加载帖子评论（楼层 + 楼中楼树形结构）；返回 items 供 useAsyncData 序列化（SSR 水合一致） */
  async function loadComments(postId: number): Promise<CommentTreeItem[]> {
    loading.value = true
    error.value = ''
    try {
      const res = await $fetch<ApiResponse<Paginated<CommentTreeItem>>>(
        `${apiBase.value}/api/posts/${postId}/comments`
      )
      comments.value = res.data.items
      return res.data.items
    } catch (err) {
      error.value = extractErrorMessage(err, '加载评论失败')
      return []
    } finally {
      loading.value = false
    }
  }

  /** 发评论/楼中楼回复 */
  async function createComment(
    postId: number,
    content: string,
    parentId?: number | null,
  ): Promise<CommentItem> {
    const res = await $fetch<ApiResponse<CommentItem>>(
      `${apiBase.value}/api/posts/${postId}/comments`,
      { method: 'POST', body: { content, parentId: parentId ?? null } }
    )
    return res.data
  }

  /** 编辑评论 */
  async function updateComment(id: number, content: string): Promise<CommentItem> {
    const res = await $fetch<ApiResponse<CommentItem>>(
      `${apiBase.value}/api/comments/${id}`,
      { method: 'PATCH', body: { content } }
    )
    return res.data
  }

  /** 删除评论 */
  async function removeComment(id: number): Promise<void> {
    await $fetch(`${apiBase.value}/api/comments/${id}`, { method: 'DELETE' })
  }

  /** 点赞评论，返回最新点赞数 */
  async function likeComment(id: number): Promise<number> {
    const res = await $fetch<ApiResponse<{ likeCount: number }>>(
      `${apiBase.value}/api/comments/${id}/like`,
      { method: 'POST' }
    )
    return res.data.likeCount
  }

  /** 取消点赞评论，返回最新点赞数 */
  async function unlikeComment(id: number): Promise<number> {
    const res = await $fetch<ApiResponse<{ likeCount: number }>>(
      `${apiBase.value}/api/comments/${id}/like`,
      { method: 'DELETE' }
    )
    return res.data.likeCount
  }

  return {
    comments,
    loading,
    error,
    loadComments,
    createComment,
    updateComment,
    removeComment,
    likeComment,
    unlikeComment,
  }
}
