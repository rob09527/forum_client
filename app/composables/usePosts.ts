import type {
  ApiResponse,
  Paginated,
  PostDetail,
  PostListItem,
} from '~/types'
import { useApiBase, extractErrorMessage } from './api'

/** 帖子列表查询参数 */
export interface PostListQuery {
  category?: string
  /** 按标签过滤（TEXT[] 包含该标签） */
  tag?: string
  sort?: 'latest' | 'hot'
  page?: number
  pageSize?: number
}

/** 发帖/编辑输入 */
export interface PostInput {
  title: string
  content: string
  category: string
  tags?: string[]
}

/**
 * 帖子相关操作。
 * 列表页用 loadPosts + 响应式状态，其余操作为一次性的 async 函数（出错抛异常）。
 */
export function usePosts() {
  const apiBase = useApiBase()

  // ── 列表状态（首页/板块页共用） ──
  const posts = ref<PostListItem[]>([])
  const total = ref(0)
  const totalPages = ref(0)
  const loading = ref(false)
  const error = ref('')

  /** 加载帖子列表（分页由服务端处理） */
  async function loadPosts(query: PostListQuery = {}): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const res = await $fetch<ApiResponse<Paginated<PostListItem>>>(
        `${apiBase.value}/api/posts`,
        { query }
      )
      posts.value = res.data.items
      total.value = res.data.total
      totalPages.value = res.data.totalPages
    } catch (err: any) {
      error.value = extractErrorMessage(err, '加载帖子失败')
    } finally {
      loading.value = false
    }
  }

  /** 帖子详情（含正文） */
  async function getPost(id: number): Promise<PostDetail> {
    const res = await $fetch<ApiResponse<PostDetail>>(
      `${apiBase.value}/api/posts/${id}`
    )
    return res.data
  }

  /** 发帖（需登录，返回新帖子详情） */
  async function createPost(input: PostInput): Promise<PostDetail> {
    const res = await $fetch<ApiResponse<PostDetail>>(
      `${apiBase.value}/api/posts`,
      { method: 'POST', body: input }
    )
    return res.data
  }

  /** 编辑帖子（仅作者） */
  async function updatePost(id: number, input: Partial<PostInput>): Promise<PostDetail> {
    const res = await $fetch<ApiResponse<PostDetail>>(
      `${apiBase.value}/api/posts/${id}`,
      { method: 'PATCH', body: input }
    )
    return res.data
  }

  /** 删除帖子（作者或管理员） */
  async function removePost(id: number): Promise<void> {
    await $fetch(`${apiBase.value}/api/posts/${id}`, { method: 'DELETE' })
  }

  /** 点赞帖子，返回最新点赞数 */
  async function likePost(id: number): Promise<number> {
    const res = await $fetch<ApiResponse<{ likeCount: number }>>(
      `${apiBase.value}/api/posts/${id}/like`,
      { method: 'POST' }
    )
    return res.data.likeCount
  }

  /** 取消点赞帖子，返回最新点赞数 */
  async function unlikePost(id: number): Promise<number> {
    const res = await $fetch<ApiResponse<{ likeCount: number }>>(
      `${apiBase.value}/api/posts/${id}/like`,
      { method: 'DELETE' }
    )
    return res.data.likeCount
  }

  return {
    posts,
    total,
    totalPages,
    loading,
    error,
    loadPosts,
    getPost,
    createPost,
    updatePost,
    removePost,
    likePost,
    unlikePost,
  }
}
