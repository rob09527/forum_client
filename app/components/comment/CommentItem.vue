<template>
  <div class="py-3">
    <div class="flex gap-3">
      <NuxtLink :to="`/user/${comment.author.id}`" class="shrink-0" :title="comment.author.username">
        <Avatar :username="comment.author.username" :avatar="comment.author.avatar" size="md" />
      </NuxtLink>

      <div class="flex-1 min-w-0">
        <!-- 作者信息行 -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm text-zinc-200 font-medium">{{ comment.author.username }}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" :class="levelBadgeClass">
            {{ levelLabel }}
          </span>
          <span v-if="comment.floor" class="text-xs text-zinc-500">#{{ comment.floor }}F</span>
          <span class="text-xs text-zinc-600">{{ timeAgo }}</span>
        </div>

        <!-- 正文 -->
        <div class="mt-1.5 text-sm text-zinc-300 markdown-body" v-html="renderMarkdown(comment.content)"></div>

        <!-- 编辑框 -->
        <div v-if="editing" class="mt-2">
          <textarea
            v-model="editContent"
            rows="3"
            class="w-full bg-zinc-900 border border-zinc-700/60 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/60 resize-y"
          ></textarea>
          <div class="flex gap-2 mt-1.5">
            <button
              class="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              :disabled="editSubmitting"
              @click="saveEdit"
            >
              {{ editSubmitting ? '保存中…' : '保存' }}
            </button>
            <button class="text-xs px-3 py-1 text-zinc-400 hover:text-zinc-200" @click="editing = false">取消</button>
          </div>
        </div>

        <!-- 操作行 -->
        <div class="flex items-center gap-4 mt-2">
          <button
            class="text-xs text-zinc-500 hover:text-blue-400 transition-colors"
            :disabled="liking"
            @click="toggleLike"
          >
            👍 {{ comment.likeCount }}
          </button>
          <button class="text-xs text-zinc-500 hover:text-zinc-200 transition-colors" @click="startReply">
            💬 回复
          </button>
          <template v-if="isAuthor">
            <button class="text-xs text-zinc-500 hover:text-zinc-200 transition-colors" @click="startEdit">
              ✏️ 编辑
            </button>
            <button class="text-xs text-zinc-500 hover:text-red-400 transition-colors" @click="remove">
              🗑 删除
            </button>
          </template>
        </div>

        <!-- 回复框 -->
        <div v-if="replying" class="mt-2">
          <textarea
            v-model="replyContent"
            rows="2"
            placeholder="回复 {{ comment.author.username }}…"
            class="w-full bg-zinc-900 border border-zinc-700/60 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 resize-y"
          ></textarea>
          <div class="flex gap-2 mt-1.5">
            <button
              class="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              :disabled="replySubmitting"
              @click="submitReply"
            >
              {{ replySubmitting ? '发送中…' : '发送' }}
            </button>
            <button class="text-xs px-3 py-1 text-zinc-400 hover:text-zinc-200" @click="replying = false">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 楼中楼回复列表（递归渲染） -->
    <div v-if="replies.length" class="ml-12 mt-2 pl-4 border-l border-zinc-700/50 space-y-2">
      <CommentItem
        v-for="r in replies"
        :key="r.id"
        :comment="r"
        @changed="emit('changed')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentTreeItem } from '~/types'
import { UserLevelLabel } from '~/types'
import { renderMarkdown } from '~/utils/markdown'
import { useComments } from '~/composables/useComments'
import { extractErrorMessage } from '~/composables/api'
import { levelBadgeClassFor } from '~/utils/format'

const props = defineProps<{ comment: CommentTreeItem }>()

const emit = defineEmits<{
  /** 评论树发生变化（新增/编辑/删除），父组件刷新列表 */
  changed: []
}>()

const { user, isLoggedIn, openLogin } = useAuth()
const { createComment, updateComment, removeComment, likeComment } = useComments()
const toast = useToast()

// 后端只返回两级树：顶层楼层的 replies 是 CommentItem（无嵌套 replies）。
// 递归渲染时统一用 ?? [] 兜底。
const replies = computed<CommentTreeItem[]>(() => (props.comment as any).replies ?? [])

const isAuthor = computed(() => !!user.value && user.value.id === props.comment.author.id)

const levelLabel = computed(() => UserLevelLabel[props.comment.author.level] ?? props.comment.author.level ?? '')
const levelBadgeClass = computed(() => levelBadgeClassFor(props.comment.author.level))

const timeAgo = useTimeAgo(() => new Date(props.comment.createdAt))

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
    ;(props.comment as any).likeCount = count
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

// ── 删除 ──
function remove() {
  if (!confirm('确定删除这条评论吗？')) return
  removeComment(props.comment.id)
    .then(() => emit('changed'))
    .catch((err: any) => toast.add({ title: extractErrorMessage(err, '删除失败'), color: 'error' }))
}
</script>
