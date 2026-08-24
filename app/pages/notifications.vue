<template>
  <div class="max-w-3xl mx-auto">
    <!-- 未登录：引导登录 -->
    <div v-if="!isLoggedIn" class="panel p-10 text-center">
      <p class="text-sm text-zinc-600 mb-4">登录后查看通知</p>
      <button
        class="px-4 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        @click="openLogin"
      >
        登录
      </button>
    </div>

    <template v-else>
      <div class="panel overflow-hidden">
        <!-- 标题 + 全部已读 -->
        <div class="flex items-center justify-between px-6 py-3 border-b border-zinc-200 bg-zinc-50">
          <h2 class="text-sm font-medium text-zinc-700">
            🔔 通知
            <span v-if="unread > 0" class="text-red-500">({{ unread }} 未读)</span>
          </h2>
          <button
            v-if="hasUnread"
            class="text-xs text-blue-600 hover:text-blue-700 transition-colors"
            @click="handleMarkAllRead"
          >
            全部已读
          </button>
        </div>

        <!-- 列表 -->
        <div v-if="loading && items.length === 0" class="px-6 py-12 text-center text-sm text-zinc-500">加载中...</div>
        <div v-else-if="items.length === 0" class="px-6 py-12 text-center">
          <p class="text-sm text-zinc-500">还没有通知，去社区逛逛吧～</p>
        </div>
        <div v-else class="divide-y divide-zinc-200/50">
          <button
            v-for="n in items"
            :key="n.id"
            class="w-full text-left px-6 py-3.5 flex items-start gap-3 hover:bg-zinc-100 transition-colors"
            :class="!n.isRead && 'bg-blue-50/60'"
            @click="handleOpen(n)"
          >
            <!-- 触发者头像（system 显示喇叭图标） -->
            <div class="shrink-0 mt-0.5">
              <div v-if="n.actors.length" class="flex -space-x-2">
                <Avatar
                  v-for="a in n.actors.slice(0, 3)"
                  :key="a.id"
                  :username="a.username"
                  :avatar="a.avatar"
                  size="sm"
                />
              </div>
              <div v-else class="w-7 h-7 rounded-full bg-blue-500/15 text-blue-600 flex items-center justify-center text-sm">📢</div>
            </div>
            <!-- 文案 -->
            <div class="flex-1 min-w-0">
              <p class="text-sm text-zinc-700 leading-snug">{{ renderText(n) }}</p>
              <p v-if="n.commentExcerpt" class="text-xs text-zinc-500 mt-1 line-clamp-2">{{ n.commentExcerpt }}</p>
              <p class="text-[11px] text-zinc-500 mt-1.5">{{ timeText(n.createdAt) }}</p>
            </div>
            <!-- 未读红点 -->
            <span v-if="!n.isRead" class="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-2"></span>
          </button>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="flex items-center justify-center py-3 border-t border-zinc-200">
          <Pagination :current-page="page" :total-pages="totalPages" @page-change="handlePageChange" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { NotificationItem } from '~/types'
import { NotificationTypeLabel } from '~/types'
import { useNotifications } from '~/composables/useNotifications'
import { extractErrorMessage } from '~/composables/api'

const toast = useToast()
const { isLoggedIn, openLogin } = useAuth()
const { unread, items, totalPages, loading, loadNotifications, markAllRead, markRead, fetchUnread } = useNotifications()

const page = ref(1)

const hasUnread = computed(() => items.value.some((n) => !n.isRead))

// 登录态恢复后加载
watch(isLoggedIn, (v) => {
  if (v) {
    page.value = 1
    fetchUnread()
    loadNotifications(1)
  }
}, { immediate: true })

function handlePageChange(newPage: number) {
  page.value = newPage
  loadNotifications(newPage)
}

async function handleMarkAllRead() {
  try {
    await markAllRead()
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '操作失败'), color: 'error' })
  }
}

/** 点击通知：先标记已读（未读时），再按类型跳转 */
async function handleOpen(n: NotificationItem) {
  if (!n.isRead) {
    try {
      await markRead(n.id)
    } catch {
      // 已读失败不阻塞跳转
    }
  }
  // follow → 关注者主页；其余带 postId → 帖子详情；system 无目标仅标记已读
  const firstActor = n.actors[0]
  if (n.type === 'follow' && firstActor) {
    navigateTo(`/user/${firstActor.id}`)
    return
  }
  if (n.postId) {
    navigateTo(`/post/${n.postId}`)
  }
}

/** 通知文案（like 聚合多人：显示前两个 + 等 N 人） */
function renderText(n: NotificationItem): string {
  if (n.type === 'system') return n.content ?? '系统通知'
  const names = n.actors.map((a) => a.username).filter(Boolean)
  const who = names.slice(0, 2).join('、')
  // actorCount 是真实总数（actorIds 只存最近 3 个），「等 N 人」用总数而非数组长度
  const total = n.actorCount ?? names.length
  const more = total > 2 ? ` 等 ${total} 人` : ''
  const postTitle = n.postTitle ? `《${n.postTitle}》` : ''
  switch (n.type) {
    case 'comment': return `${who}${more}评论了你的帖子${postTitle}`
    case 'reply': return `${who}${more}回复了你的评论`
    case 'like': return `${who}${more}赞了你的${n.postTitle ? `帖子${postTitle}` : '内容'}`
    case 'follow': return `${who}${more}关注了你`
    case 'mention': return `${who}${more}在${n.postTitle ? `《${n.postTitle}》` : '帖子'}中提到了你`
    default: return `${who}${more}${NotificationTypeLabel[n.type] ?? '有新动态'}`
  }
}

function timeText(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
