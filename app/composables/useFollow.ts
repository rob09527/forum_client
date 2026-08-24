import type { ApiResponse, FollowUserItem, Paginated, PostListItem } from '~/types'
import { useApiBase } from './api'

/**
 * 关注（单向 follow）。
 * 关注/取关为一次性操作；关注/粉丝/动态流列表用响应式状态。
 */
export function useFollow() {
  const apiBase = useApiBase()

  /** 关注用户 */
  async function followUser(userId: number): Promise<void> {
    await $fetch<ApiResponse<null>>(
      `${apiBase.value}/api/users/${userId}/follow`,
      { method: 'POST' }
    )
  }

  /** 取关 */
  async function unfollowUser(userId: number): Promise<void> {
    await $fetch<ApiResponse<null>>(
      `${apiBase.value}/api/users/${userId}/follow`,
      { method: 'DELETE' }
    )
  }

  /** 关注/取关切换（返回切换后的关注态） */
  async function toggleFollow(userId: number, current: boolean): Promise<boolean> {
    if (current) {
      await unfollowUser(userId)
      return false
    }
    await followUser(userId)
    return true
  }

  // ── 关注列表 ──
  const following = ref<FollowUserItem[]>([])
  const followingTotalPages = ref(0)
  const followingLoading = ref(false)

  async function loadFollowing(page = 1, pageSize = 20): Promise<void> {
    followingLoading.value = true
    try {
      const res = await $fetch<ApiResponse<Paginated<FollowUserItem>>>(
        `${apiBase.value}/api/me/following`,
        { query: { page, pageSize } }
      )
      following.value = res.data.items
      followingTotalPages.value = res.data.totalPages
    } finally {
      followingLoading.value = false
    }
  }

  // ── 粉丝列表 ──
  const followers = ref<FollowUserItem[]>([])
  const followersTotalPages = ref(0)
  const followersLoading = ref(false)

  async function loadFollowers(page = 1, pageSize = 20): Promise<void> {
    followersLoading.value = true
    try {
      const res = await $fetch<ApiResponse<Paginated<FollowUserItem>>>(
        `${apiBase.value}/api/me/followers`,
        { query: { page, pageSize } }
      )
      followers.value = res.data.items
      followersTotalPages.value = res.data.totalPages
    } finally {
      followersLoading.value = false
    }
  }

  // ── 关注动态流 ──
  const feed = ref<PostListItem[]>([])
  const feedTotalPages = ref(0)
  const feedLoading = ref(false)

  async function loadFeed(page = 1, pageSize = 20): Promise<void> {
    feedLoading.value = true
    try {
      const res = await $fetch<ApiResponse<Paginated<PostListItem>>>(
        `${apiBase.value}/api/me/following/posts`,
        { query: { page, pageSize } }
      )
      feed.value = res.data.items
      feedTotalPages.value = res.data.totalPages
    } finally {
      feedLoading.value = false
    }
  }

  return {
    followUser,
    unfollowUser,
    toggleFollow,
    following,
    followingTotalPages,
    followingLoading,
    loadFollowing,
    followers,
    followersTotalPages,
    followersLoading,
    loadFollowers,
    feed,
    feedTotalPages,
    feedLoading,
    loadFeed,
  }
}
