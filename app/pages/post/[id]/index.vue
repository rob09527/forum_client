<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <!-- 未登录：登录引导（详情接口需登录，SSR/首帧未登录先提示，与 /my/posts 同策略） -->
    <div v-if="!isLoggedIn" class="panel p-10 text-center">
      <p class="text-sm text-zinc-600 mb-4">登录后查看帖子内容</p>
      <button
        class="px-4 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        @click="openLogin"
      >
        登录
      </button>
    </div>

    <template v-else>
      <!-- 加载中 -->
      <div v-if="pending" class="panel p-10 text-center text-sm text-zinc-500">
        加载中…
      </div>

      <!-- 帖子不存在 / 加载失败 -->
      <div v-else-if="!post" class="panel p-10 text-center">
        <p class="text-zinc-600 text-sm mb-3">帖子不存在或已被删除</p>
        <NuxtLink to="/" class="text-sm text-blue-600 hover:text-blue-500">返回首页</NuxtLink>
      </div>

      <!-- 正文 -->
      <article v-else class="panel p-6">
        <!-- 标题 + 置顶/热门标 -->
        <div class="flex items-center gap-2 mb-3">
          <span v-if="post.isPinned" class="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 font-medium">📌 置顶</span>
          <h1 class="text-xl font-semibold text-zinc-900 leading-snug">{{ post.title }}</h1>
        </div>

        <!-- 板块 + 标签 -->
        <div class="flex items-center gap-2 flex-wrap mb-4">
          <span class="text-xs px-2 py-0.5 rounded font-medium" :class="categoryBadge(post.category)">
            {{ categoryName(post.category) }}
          </span>
          <NuxtLink
            v-for="t in post.tags"
            :key="t"
            :to="`/?tag=${encodeURIComponent(t)}`"
            class="text-xs text-zinc-500 hover:text-blue-700 transition-colors"
          >
            #{{ t }}
          </NuxtLink>
        </div>

        <!-- 作者信息 -->
        <div class="flex items-center gap-3 pb-4 mb-4 border-b border-zinc-200">
          <NuxtLink :to="`/user/${post.author.id}`" class="shrink-0">
            <Avatar :username="post.author.username" :avatar="post.author.avatar" size="lg" />
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-zinc-800">{{ post.author.username }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" :class="authorLevelClass">
                {{ authorLevelLabel }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
              <span>发布于 {{ postTimeAgo }}</span>
              <span v-if="edited" class="text-zinc-600">· 最后编辑于 {{ editTimeAgo }}</span>
            </div>
          </div>
          <!-- 统计 -->
          <div class="flex items-center gap-3 text-xs text-zinc-500 flex-shrink-0">
            <span>👁 {{ formatCount(post.viewCount) }}</span>
            <span>👍 {{ likeCount }}</span>
            <span>💬 {{ commentCount }}</span>
          </div>
        </div>

        <!-- 正文（Markdown 渲染） -->
        <div class="text-[15px] leading-7 text-zinc-700 markdown-body" v-html="renderMarkdown(post.content)"></div>

        <!-- 操作行 -->
        <div class="flex items-center gap-3 mt-6 pt-4 border-t border-zinc-200">
          <button
            class="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors"
            :class="liked ? 'bg-blue-500/20 text-blue-600' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'"
            @click="toggleLike"
          >
            👍 {{ liked ? '已点赞' : '点赞' }}
          </button>
          <button
            class="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors"
            :class="bookmarked ? 'bg-amber-500/20 text-amber-600' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'"
            @click="toggleBookmarkClick"
          >
            🔖 {{ bookmarked ? '已收藏' : '收藏' }}
          </button>
          <NuxtLink
            v-if="isAuthor"
            :to="`/post/${post.id}/edit`"
            class="text-sm text-zinc-600 hover:text-blue-700 transition-colors"
          >
            ✏️ 编辑
          </NuxtLink>
          <button
            v-if="isAuthor"
            class="text-sm text-zinc-600 hover:text-red-600 transition-colors"
            @click="remove"
          >
            🗑 删除
          </button>
        </div>
      </article>

      <!-- 评论区 -->
      <section v-if="post" class="panel p-6">
        <h2 class="text-sm font-medium text-zinc-700 mb-4">💬 {{ commentCount }} 条评论</h2>

        <!-- 发评论 -->
        <div class="mb-6">
          <MarkdownEditor
            v-model="newComment"
            toolbar="compact"
            :height="180"
            placeholder="友善发言，理性讨论…"
          />
          <div class="flex items-center justify-end mt-2">
            <button
              class="px-4 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-md transition-colors"
              :disabled="commentSubmitting || !newComment.trim()"
              @click="submitComment"
            >
              {{ commentSubmitting ? '发表中…' : '发表评论' }}
            </button>
          </div>
        </div>

        <!-- 评论列表 -->
        <div v-if="commentPending" class="py-6 text-center text-sm text-zinc-500">评论加载中…</div>
        <div v-else-if="comments.length" class="divide-y divide-zinc-200/50">
          <CommentItem
            v-for="c in comments"
            :key="c.id"
            :comment="c"
            @changed="refresh"
          />
        </div>
        <div v-else class="py-10 text-center">
          <img :src="'/images/empty-state.webp'" alt="还没有评论" class="w-36 mx-auto mb-3 rounded-lg" loading="lazy" />
          <p class="text-sm text-zinc-600">还没有评论，来抢沙发吧～</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PostDetail } from '~/types'
import { categoryBadge, categoryName } from '~/constants/categories'
import { renderMarkdown } from '~/utils/markdown'
import { formatCount } from '~/utils/format'
import { usePosts } from '~/composables/usePosts'
import { useComments } from '~/composables/useComments'
import { useBookmarks } from '~/composables/useBookmarks'
import { extractErrorMessage } from '~/composables/api'
import { useGameConfig } from '~/composables/useGameConfig'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const postId = Number(route.params.id)
// 非法/越界 id 直接视为不存在，避免向 /api/posts/NaN 发无效请求
const postIdValid = Number.isInteger(postId) && postId > 0

const { getPost, removePost, likePost, unlikePost } = usePosts()
const { comments, loadComments, createComment } = useComments()
const { toggleBookmark } = useBookmarks()
const { user, isLoggedIn, openLogin } = useAuth()

// ── 帖子数据（详情接口需登录；SSR 未登录 401 返回 null，登录后重拉） ──
const { data: post, pending, refresh: refreshPost } = useAsyncData<PostDetail | null>(
  `post-${postId}`,
  () => (postIdValid ? getPost(postId).catch(() => null) : Promise.resolve(null))
)

// ── 评论数据（SSR 也加载，避免首屏闪"还没有评论"；操作后用 refresh 重拉） ──
const { pending: commentPending, refresh: refreshComments } = useAsyncData(
  `post-comments-${postId}`,
  () => (postIdValid ? loadComments(postId) : Promise.resolve())
)

// 登录态从 null → 有值时重新拉取（详情/评论在登录后才需要）。
// 仅在帖子尚未加载成功时补拉（如 SSR 未登录 401 后登录成功），
// 已有数据时跳过，避免 hydration/已登录访问时重复请求
watch(isLoggedIn, (v) => {
  if (v && !post.value) {
    refreshPost()
    refreshComments()
  }
})

// ── 点赞状态（后端详情不返回"是否已赞"，本地维护，重复点赞时报错时校准） ──
const likeCount = ref(0)
const liked = ref(false)

watchEffect(() => {
  if (post.value) {
    likeCount.value = post.value.likeCount
    liked.value = false
  }
})

async function toggleLike() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  try {
    if (liked.value) {
      likeCount.value = await unlikePost(postId)
      liked.value = false
    } else {
      likeCount.value = await likePost(postId)
      liked.value = true
    }
  } catch (err: any) {
    // 已经点过赞/还没点赞 → 校准本地状态，避免 UI 与后端不一致
    const code = err?.data?.error?.code
    if (code === 'ALREADY_LIKED') liked.value = true
    if (code === 'NOT_LIKED') liked.value = false
    toast.add({ title: extractErrorMessage(err, '操作失败'), color: 'error' })
  }
}

// ── 收藏状态（后端详情返回 isBookmarked 作初始值，切换后本地维护） ──
const bookmarked = ref(false)

watchEffect(() => {
  if (post.value) {
    bookmarked.value = post.value.isBookmarked
  }
})

async function toggleBookmarkClick() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  try {
    bookmarked.value = await toggleBookmark(postId, bookmarked.value)
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '操作失败'), color: 'error' })
  }
}

// ── 作者权限 ──
const isAuthor = computed(() => !!user.value && !!post.value && user.value.id === post.value.author.id)

function remove() {
  if (!confirm('删除后帖子、评论和点赞都会被清除，确定吗？')) return
  removePost(postId)
    .then(() => {
      toast.add({ title: '帖子已删除', color: 'success' })
      router.push('/')
    })
    .catch((err: any) => toast.add({ title: extractErrorMessage(err, '删除失败'), color: 'error' }))
}

// ── 评论区 ──
const newComment = ref('')
const commentSubmitting = ref(false)
const commentCount = ref(0)

watchEffect(() => {
  if (post.value) commentCount.value = post.value.commentCount
})

/** 评论树变化后刷新：重新拉评论 + 同步计数 */
async function refresh() {
  await Promise.all([refreshComments(), refreshPost()])
}

async function submitComment() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  if (!newComment.value.trim()) return
  commentSubmitting.value = true
  try {
    await createComment(postId, newComment.value.trim())
    newComment.value = ''
    await refresh()
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '评论失败'), color: 'error' })
  } finally {
    commentSubmitting.value = false
  }
}

// ── 展示辅助 ──
// 等级名/徽章来自后台配置，未加载时回退静态映射
const { levelName, levelBadgeClass: badgeFor } = useGameConfig()
const authorLevelClass = computed(() => badgeFor(post.value?.author.level))
const authorLevelLabel = computed(() => levelName(post.value?.author.level))

const postTimeAgo = useTimeAgo(() => new Date(post.value?.createdAt ?? ''))
const editTimeAgo = useTimeAgo(() => new Date(post.value?.updatedAt ?? ''))
// 距创建超过 1 秒才算「编辑过」，过滤建帖时的自动写入噪声
const EDITED_THRESHOLD_MS = 1000
const edited = computed(() => {
  if (!post.value) return false
  return new Date(post.value.updatedAt).getTime() - new Date(post.value.createdAt).getTime() > EDITED_THRESHOLD_MS
})
</script>
