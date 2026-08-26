<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <!-- 游客可直接阅读正文；点赞/收藏/评论/打赏在各自操作处引导登录 -->
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
          <span v-if="post.isPinned" class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 font-medium"><AppIcon name="pin" :size="12" /> 置顶</span>
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

        <!-- 悬赏横幅 [3.5]：标题下，金额 + 剩余时间 + 状态；托管中给发起人「取消悬赏」 -->
        <div
          v-if="post.bountyStatus"
          class="mb-4 px-4 py-3 rounded-md border text-sm flex items-center gap-2 flex-wrap"
          :class="bountyBannerClass"
        >
          <span class="font-medium text-amber-700 inline-flex items-center gap-1"><AppIcon name="coins" :size="14" /> {{ post.bountyAmount }}🍗 悬赏</span>
          <span class="text-xs px-1.5 py-0.5 rounded bg-white/70 font-medium text-zinc-600">
            {{ BountyStatusLabel[post.bountyStatus] }}
          </span>
          <template v-if="post.bountyStatus === 'escrow'">
            <!-- 倒计时基于 Date.now()，SSR 与客户端渲染必然不同，必须 ClientOnly 包裹（data-allow-mismatch 不是 Vue 属性，不抑制水合告警） -->
            <ClientOnly>
              <span class="text-xs text-zinc-500 font-mono tabular-nums">剩余 {{ bountyCountdown.text }}</span>
              <template #fallback>
                <span class="text-xs text-zinc-500 font-mono tabular-nums" aria-hidden="true">剩余 --:--:--</span>
              </template>
            </ClientOnly>
            <span class="text-xs text-zinc-500">{{ bountyConfig.timeoutDays }} 天未采纳将自动判给最高赞回答</span>
            <button
              v-if="isAuthor"
              class="ml-auto text-xs text-zinc-500 hover:text-red-600 transition-colors"
              @click="showCancelBounty = true"
            >
              取消悬赏
            </button>
          </template>
          <span v-else-if="post.bountyStatus === 'settled'" class="text-xs text-emerald-600 inline-flex items-center gap-1">
            <AppIcon name="check-circle" :size="14" /> 回答者已获得 {{ bountyPayout }}🍗（已扣除 {{ bountyFeePct }}% 手续费）
          </span>
          <span v-else class="text-xs text-zinc-500">金额已全额退回发起人</span>
        </div>

        <!-- 作者信息 -->
        <div class="flex items-center gap-3 pb-4 mb-4 border-b border-zinc-200">
          <NuxtLink :to="`/user/${post.author.id}`" class="shrink-0">
            <Avatar :username="post.author.username" :avatar="post.author.avatar" size="lg" />
          </NuxtLink>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <!-- 全站统一用户名渲染（装饰自动生效） -->
              <UsernameText :author="post.author" />
            </div>
            <div class="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
              <span>发布于 {{ postTimeAgo }}</span>
              <span v-if="edited" class="text-zinc-600">· 最后编辑于 {{ editTimeAgo }}</span>
            </div>
          </div>
          <!-- 统计 -->
          <div class="flex items-center gap-3 text-xs text-zinc-500 flex-shrink-0">
            <span class="inline-flex items-center gap-1"><AppIcon name="eye" :size="13" /> {{ formatCount(post.viewCount) }}</span>
            <span class="inline-flex items-center gap-1"><AppIcon name="thumbs-up" :size="13" /> {{ likeCount }}</span>
            <span class="inline-flex items-center gap-1"><AppIcon name="message-square" :size="13" /> {{ commentCount }}</span>
          </div>
        </div>

        <!-- 正文（Markdown 渲染） -->
        <div class="text-[15px] leading-7 text-zinc-700 markdown-body" v-html="renderMarkdown(post.content)"></div>

        <!-- 打赏汇总 [1.5.3]：🍗 N 人打赏 · 共 X（正文下方） -->
        <PostTipSummary :post-id="post.id" :refresh-key="tipRefreshKey" />

        <!-- 操作行 -->
        <div class="flex items-center gap-3 mt-6 pt-4 border-t border-zinc-200">
          <button
            class="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors"
            :class="liked ? 'bg-blue-500/20 text-blue-600' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'"
            @click="toggleLike"
          >
            <AppIcon name="thumbs-up" :size="15" /> {{ liked ? '已点赞' : '点赞' }}
          </button>
          <button
            class="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors"
            :class="bookmarked ? 'bg-amber-500/20 text-amber-600' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'"
            @click="toggleBookmarkClick"
          >
            <AppIcon name="bookmark" :size="15" /> {{ bookmarked ? '已收藏' : '收藏' }}
          </button>
          <!-- 打赏入口：不能赏自己 [CANNOT_TIP_SELF]；游客点击先引导登录 -->
          <button
            v-if="!isAuthor"
            class="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors bg-zinc-100 hover:bg-zinc-200 text-amber-700"
            @click="openTip"
          >
            🍗 赏
          </button>
          <NuxtLink
            v-if="isAuthor"
            :to="`/post/${post.id}/edit`"
            class="text-sm text-zinc-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
          >
            <AppIcon name="edit" :size="14" /> 编辑
          </NuxtLink>
          <button
            v-if="isAuthor"
            class="text-sm text-zinc-600 hover:text-red-600 transition-colors inline-flex items-center gap-1"
            @click="remove"
          >
            <AppIcon name="trash" :size="14" /> 删除
          </button>
        </div>
      </article>

      <!-- 删除确认（统一弹窗封装，替代原生 confirm） -->
      <ConfirmModal
        v-model="showDeleteConfirm"
        title="删除帖子"
        message="删除后帖子、评论和点赞都会被清除，此操作不可恢复。"
        confirm-text="删除"
        danger
        :loading="deleting"
        @confirm="doRemove"
      />

      <!-- 取消悬赏确认（统一弹窗封装；已有有效回答时后端拒绝）[1.6.2] -->
      <ConfirmModal
        v-model="showCancelBounty"
        title="取消悬赏"
        message="取消后托管金额将全额退回你的余额（已有有效回答时不可取消）。此操作不可逆，确定取消吗？"
        confirm-text="取消悬赏"
        :loading="cancelling"
        @confirm="doCancelBounty"
      />

      <!-- 打赏弹窗 -->
      <TipModal
        v-model="tipOpen"
        target-type="post"
        :target-id="postId"
        :target-name="tipTargetName"
        @tipped="onTipped"
      />

      <!-- 评论区 -->
      <section v-if="post" class="panel p-6">
        <h2 class="text-sm font-medium text-zinc-700 mb-4 inline-flex items-center gap-1"><AppIcon name="message-square" :size="14" /> {{ commentCount }} 条评论</h2>

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
              class="btn btn-primary px-4 py-1.5 text-sm"
              :disabled="commentSubmitting || !newComment.trim()"
              @click="submitComment"
            >
              {{ commentSubmitting ? '发表中…' : '发表评论' }}
            </button>
          </div>
        </div>

        <!-- 评论列表 -->
        <div v-if="commentPending" class="py-6 text-center text-sm text-zinc-500">评论加载中…</div>
        <div v-else-if="orderedComments.length" class="divide-y divide-zinc-200/50">
          <CommentItem
            v-for="c in orderedComments"
            :key="c.id"
            :comment="c"
            :is-bounty-author="isAuthor && post.bountyStatus === 'escrow'"
            :is-accepted="c.id === acceptedCommentId"
            :bounty-payout="bountyPayout"
            :bounty-id="post.bountyId ?? undefined"
            @changed="refresh"
            @accepted="refresh"
          />
        </div>
        <div v-else class="py-10 text-center">
          <img :src="'/images/empty-state.webp'" alt="还没有评论" class="w-36 mx-auto mb-3 rounded-lg" loading="lazy" />
          <p class="text-sm text-zinc-600">还没有评论，来抢沙发吧～</p>
        </div>
      </section>
  </div>
</template>

<script setup lang="ts">
import type { CommentTreeItem, PostDetail } from '~/types'
import { BountyStatusLabel } from '~/types'
import { categoryBadge, categoryName } from '~/constants/categories'
import { renderMarkdown } from '~/utils/markdown'
import { formatCount } from '~/utils/format'
import { usePosts } from '~/composables/usePosts'
import { useComments } from '~/composables/useComments'
import { useBookmarks } from '~/composables/useBookmarks'
import { useBounty } from '~/composables/useBounty'
import { useBountyCountdown } from '~/composables/useBountyCountdown'
import { useGameConfig } from '~/composables/useGameConfig'
import { extractErrorMessage } from '~/composables/api'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const postId = Number(route.params.id)
// 非法/越界 id 直接视为不存在，避免向 /api/posts/NaN 发无效请求
const postIdValid = Number.isInteger(postId) && postId > 0

const { getPost, removePost, likePost, unlikePost } = usePosts()
const { loadComments, createComment } = useComments()
const { toggleBookmark } = useBookmarks()
const { user, isLoggedIn, openLogin } = useAuth()
const { bountyConfig } = useGameConfig()
const { cancel: cancelBounty } = useBounty()

// ── 帖子数据（游客可读；登录后注入 isBookmarked 等个性化字段） ──
const { data: post, pending, refresh: refreshPost } = useAsyncData<PostDetail | null>(
  `post-${postId}`,
  () => (postIdValid ? getPost(postId).catch(() => null) : Promise.resolve(null))
)

// ── 评论数据（SSR 也加载，避免首屏闪"还没有评论"；操作后用 refresh 重拉） ──
const { data: commentsData, pending: commentPending, refresh: refreshComments } = useAsyncData<CommentTreeItem[]>(
  `post-comments-${postId}`,
  () => (postIdValid ? loadComments(postId) : Promise.resolve([]))
)

// 游客登录后重拉详情/评论，注入 isBookmarked 等个性化字段
// （游客态已能拉到正文，此处只在登录态翻转时补一次个性化数据）
watch(isLoggedIn, (v) => {
  if (v) {
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

const showDeleteConfirm = ref(false)
const deleting = ref(false)

function remove() {
  showDeleteConfirm.value = true
}

// ── 打赏 ──
const tipOpen = ref(false)
/** 打开打赏弹窗；游客先引导登录 */
function openTip() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  tipOpen.value = true
}
/** 打赏成功 → 递增，触发 PostTipSummary 重新拉取 */
const tipRefreshKey = ref(0)
/** TipModal 目标名（post 在外层 v-else 链之外可为 null，守卫取值） */
const tipTargetName = computed(() => post.value?.author.username ?? '')

function onTipped() {
  tipRefreshKey.value++
}

async function doRemove() {
  deleting.value = true
  try {
    await removePost(postId)
    showDeleteConfirm.value = false
    toast.add({ title: '帖子已删除', color: 'success' })
    router.push('/')
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '删除失败'), color: 'error' })
  } finally {
    deleting.value = false
  }
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

// ── 悬赏详情横幅 [3.5]：金额 + 剩余时间 + 状态；托管中给发起人「取消悬赏」 ──
const bountyCountdown = useBountyCountdown(() => post.value?.bountyExpireAt)
// 到 0 后端结算（server 60s 调度器）→ 拉一次详情刷新状态（bountyStatus 变 settled/refunded）
watch(bountyCountdown.expired, (expired) => {
  if (expired && post.value?.bountyStatus === 'escrow') refreshPost()
})

const bountyBannerClass = computed(() => {
  switch (post.value?.bountyStatus) {
    case 'escrow': return 'bg-amber-500/10 border-amber-500/30'
    case 'settled': return 'bg-emerald-500/10 border-emerald-500/30'
    default: return 'bg-zinc-500/5 border-zinc-300'
  }
})

/** 采纳实发金额 = 托管金额 − 手续费（与后端同算法，对账口径见审计 B2） */
const bountyPayout = computed(() => {
  const amt = post.value?.bountyAmount
  if (!amt) return 0
  return Math.floor(amt * (1 - bountyConfig.value.feeRate))
})
const bountyFeePct = computed(() => Math.round(bountyConfig.value.feeRate * 100))

const showCancelBounty = ref(false)
const cancelling = ref(false)
async function doCancelBounty() {
  if (!post.value?.bountyId) return
  cancelling.value = true
  try {
    await cancelBounty(post.value.bountyId)
    showCancelBounty.value = false
    toast.add({ title: '悬赏已取消，托管金已退回', color: 'success' })
    await refreshPost()
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '取消失败'), color: 'error' })
    await refreshPost() // 可能因已有有效回答被拒 → 刷新让横幅反映最新
  } finally {
    cancelling.value = false
  }
}

// ── 采纳置顶 [3.5]：被采纳的回答排到评论区最前（其余保持原序，稳定排序） ──
const acceptedCommentId = computed(() => post.value?.bountyAcceptedCommentId ?? null)
const orderedComments = computed<CommentTreeItem[]>(() => {
  const acc = acceptedCommentId.value
  const items = commentsData.value ?? []
  if (!acc) return items
  return [...items].sort((a, b) => {
    if (a.id === acc) return -1
    if (b.id === acc) return 1
    return 0
  })
})

// ── 展示辅助 ──
const postTimeAgo = useTimeAgo(() => new Date(post.value?.createdAt ?? ''))
const editTimeAgo = useTimeAgo(() => new Date(post.value?.updatedAt ?? ''))
// 距创建超过 1 秒才算「编辑过」，过滤建帖时的自动写入噪声
const EDITED_THRESHOLD_MS = 1000
const edited = computed(() => {
  if (!post.value) return false
  return new Date(post.value.updatedAt).getTime() - new Date(post.value.createdAt).getTime() > EDITED_THRESHOLD_MS
})
</script>
