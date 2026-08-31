<template>
  <div class="py-3">
    <div class="flex gap-3">
      <NuxtLink :to="`/user/${comment.author.id}`" class="shrink-0" :title="comment.author.username">
        <Avatar :username="comment.author.username" :avatar="comment.author.avatar" size="md" />
      </NuxtLink>

      <div class="flex-1 min-w-0">
        <!-- 作者信息行：全站统一用户名渲染（装饰自动生效） -->
        <div class="flex items-center gap-2 flex-wrap">
          <UsernameText :author="comment.author" />
          <span v-if="comment.floor" class="text-xs text-zinc-500">#{{ comment.floor }}F</span>
          <!-- 已采纳回答标记 [3.5]：绿色勾 + 实发金额 -->
          <span
            v-if="isAccepted"
            class="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"
          >
            <AppIcon name="check-circle" :size="14" /> 已采纳 · 获得 {{ bountyPayout }}🍗
          </span>
          <span class="text-xs text-zinc-600">{{ timeAgo }}</span>
        </div>

        <!-- 正文 -->
        <div class="mt-1.5 text-sm text-zinc-700 markdown-body" v-html="renderMarkdown(comment.content)"></div>

        <!-- 编辑框 -->
        <div v-if="editing" class="mt-2">
          <MarkdownEditor v-model="editContent" toolbar="compact" :height="160" />
          <div class="flex gap-2 mt-1.5">
            <button
              class="btn btn-primary text-xs px-3 py-1"
              :disabled="editSubmitting"
              @click="saveEdit"
            >
              {{ editSubmitting ? '保存中…' : '保存' }}
            </button>
            <button class="btn btn-ghost text-xs px-3 py-1" @click="editing = false">取消</button>
          </div>
        </div>

        <!-- 操作行 -->
        <div class="flex items-center gap-4 mt-2">
          <!-- 悬赏采纳（发起人视角，仅顶层回答，不含发起人自答；不可逆，二次确认）[1.6.5] -->
          <button
            v-if="isBountyAuthor && !isAccepted && comment.parentId == null && comment.author.id !== user?.id"
            class="text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
            @click="showAcceptConfirm = true"
          >
            <AppIcon name="check-circle" :size="13" /> 采纳
          </button>
          <button
            class="text-xs text-zinc-500 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
            :disabled="liking"
            @click="toggleLike"
          >
            <AppIcon name="thumbs-up" :size="13" /> {{ likeCount }}
          </button>
          <!-- 评论打赏（轻量，不能赏自己）；🍗 为积分货币单位，保留 emoji -->
          <button
            v-if="!isAuthor"
            class="text-xs text-zinc-500 hover:text-amber-700 transition-colors"
            @click="openTip"
          >
            🍗 赏{{ tipCount ? ` ${tipCount}` : '' }}
          </button>
          <button class="text-xs text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-1" @click="startReply">
            <AppIcon name="message-square" :size="13" /> 回复
          </button>
          <template v-if="isAuthor">
            <button class="text-xs text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-1" @click="startEdit">
              <AppIcon name="edit" :size="13" /> 编辑
            </button>
            <button class="text-xs text-zinc-500 hover:text-red-600 transition-colors inline-flex items-center gap-1" @click="remove">
              <AppIcon name="trash" :size="13" /> 删除
            </button>
          </template>
        </div>

        <!-- 回复框 -->
        <div v-if="replying" class="mt-2">
          <MarkdownEditor
            v-model="replyContent"
            :height="140"
            :placeholder="`回复 ${comment.author.username}…`"
          ></MarkdownEditor>
          <div class="flex gap-2 mt-1.5">
            <button
              class="btn btn-primary text-xs px-3 py-1"
              :disabled="replySubmitting"
              @click="submitReply"
            >
              {{ replySubmitting ? '发送中…' : '发送' }}
            </button>
            <button class="btn btn-ghost text-xs px-3 py-1" @click="replying = false">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 楼中楼回复列表（递归渲染） -->
    <div v-if="replies.length" class="ml-6 sm:ml-12 mt-2 pl-4 border-l border-zinc-200 space-y-2">
      <CommentItem
        v-for="r in replies"
        :key="r.id"
        :comment="r"
        @changed="emit('changed')"
      />
    </div>

    <!-- 删除确认（统一弹窗封装，替代原生 confirm） -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="删除评论"
      message="确定删除这条评论吗？删除后无法恢复。"
      confirm-text="删除"
      danger
      :loading="deleting"
      @confirm="doRemove"
    />

    <!-- 采纳确认（不可逆，统一弹窗封装）[1.6.5] -->
    <ConfirmModal
      v-model="showAcceptConfirm"
      title="采纳该回答"
      message="采纳后悬赏将立即结算给这位回答者，此操作不可撤销。确定采纳吗？"
      confirm-text="采纳并结算"
      :loading="accepting"
      @confirm="doAccept"
    />

    <!-- 评论打赏弹窗 -->
    <TipModal
      v-model="tipOpen"
      target-type="comment"
      :target-id="comment.id"
      :target-name="comment.author.username"
      @tipped="onTipped"
    />
  </div>
</template>

<script setup lang="ts">
import type { CommentTreeItem } from '~/types'
import { renderMarkdown } from '~/utils/markdown'
import { useComments } from '~/composables/useComments'
import { useBounty } from '~/composables/useBounty'
import { extractErrorMessage } from '~/composables/api'

const props = defineProps<{
  comment: CommentTreeItem
  /** 悬赏帖发起人视角：顶层回答显示「采纳」按钮 [3.5] */
  isBountyAuthor?: boolean
  /** 本回答是否被采纳（详情 bountyAcceptedCommentId 命中，渲染已采纳标记） */
  isAccepted?: boolean
  /** 采纳实发金额（托管金额 − 手续费），已采纳标记展示用 */
  bountyPayout?: number
  /** Bounty 账本 ID（采纳端点用 Bounty.id 而非 post id，见详情页 [3.5]） */
  bountyId?: number
}>()

const emit = defineEmits<{
  /** 评论树发生变化（新增/编辑/删除），父组件刷新列表 */
  changed: []
  /** 采纳成功（发起人采纳回答），父组件刷新评论区 + 帖子状态 */
  accepted: []
}>()

const { user, isLoggedIn, openLogin } = useAuth()
const { createComment, updateComment, removeComment, likeComment } = useComments()
const { accept: acceptAnswer } = useBounty()
const toast = useToast()

// 后端只返回两级树：顶层楼层的 replies 是 CommentItem（无嵌套 replies）。
// replies 字段可选，递归渲染时统一用 ?? [] 兜底。
const replies = computed<CommentTreeItem[]>(() => props.comment.replies ?? [])

// 本地点赞数展示：props 只读不可直接改写，点赞成功后更新本地 ref 回显（父级刷新时再同步）
const likeCount = ref(props.comment.likeCount)
watch(() => props.comment.likeCount, (v) => { likeCount.value = v })

const isAuthor = computed(() => !!user.value && user.value.id === props.comment.author.id)

const timeAgo = useTimeAgo(() => new Date(props.comment.createdAt))

// ── 悬赏采纳（发起人视角） ──
const showAcceptConfirm = ref(false)
const accepting = ref(false)
async function doAccept() {
  if (!props.bountyId) return
  accepting.value = true
  try {
    await acceptAnswer(props.bountyId, props.comment.id)
    showAcceptConfirm.value = false
    emit('accepted')
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '采纳失败'), color: 'error' })
  } finally {
    accepting.value = false
  }
}

// ── 评论打赏（轻量计数：本地点赞式回显，父级刷新时再同步） ──
const tipCount = ref(props.comment.tipCount ?? 0)
watch(() => props.comment.tipCount, (v) => { tipCount.value = v ?? 0 })

const tipOpen = ref(false)
function openTip() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  tipOpen.value = true
}

/** 打赏成功：本地计数 +1（金额后端已扣，余额经铁律同步） */
function onTipped() {
  tipCount.value += 1
}

// ── 点赞 ──
const liking = ref(false)
async function toggleLike() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  liking.value = true
  try {
    const count = await likeComment(props.comment.id)
    likeCount.value = count
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '操作失败'), color: 'error' })
  } finally {
    liking.value = false
  }
}

// ── 回复 ──
const replying = ref(false)
const replyContent = ref('')
const replySubmitting = ref(false)

function startReply() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  replying.value = true
  replyContent.value = ''
}

async function submitReply() {
  if (!replyContent.value.trim()) return
  replySubmitting.value = true
  try {
    await createComment(props.comment.postId, replyContent.value.trim(), props.comment.id)
    replying.value = false
    emit('changed')
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '回复失败'), color: 'error' })
  } finally {
    replySubmitting.value = false
  }
}

// ── 编辑 ──
const editing = ref(false)
const editContent = ref('')
const editSubmitting = ref(false)

function startEdit() {
  editing.value = true
  editContent.value = props.comment.content
}

async function saveEdit() {
  if (!editContent.value.trim()) return
  editSubmitting.value = true
  try {
    await updateComment(props.comment.id, editContent.value.trim())
    editing.value = false
    emit('changed')
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '保存失败'), color: 'error' })
  } finally {
    editSubmitting.value = false
  }
}

// ── 删除（统一确认弹窗） ──
const showDeleteConfirm = ref(false)
const deleting = ref(false)

function remove() {
  showDeleteConfirm.value = true
}

async function doRemove() {
  deleting.value = true
  try {
    await removeComment(props.comment.id)
    showDeleteConfirm.value = false
    emit('changed')
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '删除失败'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
