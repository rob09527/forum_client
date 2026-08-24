<template>
  <div>
    <!-- 未登录：引导登录 -->
    <div v-if="!isLoggedIn" class="panel p-10 text-center">
      <p class="text-sm text-zinc-600 mb-4">登录后查看你的收藏</p>
      <button
        class="px-4 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        @click="openLogin"
      >
        登录
      </button>
    </div>

    <!-- 已登录：我的收藏列表 -->
    <template v-else>
      <div class="panel overflow-hidden">
        <div class="flex items-center justify-between px-6 py-3 border-b border-zinc-200 bg-white/60">
          <h1 class="text-sm font-medium text-zinc-700">🔖 我的收藏 <span v-if="total > 0" class="text-zinc-500 text-xs font-normal">({{ total }})</span></h1>
        </div>

        <div v-if="loading && items.length === 0" class="px-6 py-12 text-center text-sm text-zinc-500">加载中...</div>
        <div v-else-if="items.length === 0" class="px-6 py-12 text-center">
          <p class="text-sm text-zinc-500">还没有收藏任何帖子，去收藏喜欢的内容吧～</p>
        </div>
        <div v-else class="divide-y divide-zinc-200">
          <PostItem v-for="b in items" :key="b.post.id" :post="b.post">
            <!-- 常驻的收藏态切换：琥珀色 🔖 = 已收藏，点击先弹确认框防误触，确认后取消并移除（与详情页收藏按钮同视觉语言） -->
            <template #trailing>
              <!-- 点击仅唤起确认框防误触，确认后才真正取消收藏 -->
              <button
                class="shrink-0 flex items-center justify-center w-8 h-8 rounded-md transition-all
                       bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 hover:scale-105 active:scale-95"
                title="取消收藏"
                aria-label="取消收藏"
                @click="confirmTarget = b"
              >
                <span class="text-base leading-none">🔖</span>
              </button>
            </template>
          </PostItem>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="flex items-center justify-center py-3 border-t border-zinc-200">
          <Pagination :current-page="page" :total-pages="totalPages" @page-change="handlePageChange" />
        </div>
      </div>
    </template>

    <!-- 取消收藏二次确认弹窗：点 🔖 先确认再移除，防误触（与 AuthModal 同款弹窗动画） -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="confirmTarget"
          class="fixed inset-0 z-[100] flex items-center justify-center"
          @keydown.escape="closeConfirm"
        >
          <!-- 遮罩：点击关闭 -->
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeConfirm" />
          <!-- 确认卡片 -->
          <div class="relative bg-white border border-zinc-200 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 class="text-base font-semibold text-zinc-800 mb-1.5">取消收藏</h3>
            <p class="text-sm text-zinc-600 leading-relaxed">
              确定取消收藏「<span class="text-zinc-800 font-medium">{{ confirmTarget.post.title }}</span>」吗？
            </p>
            <p class="text-xs text-zinc-400 mt-1.5">取消后该帖将从你的收藏列表移除，需要时可重新收藏。</p>
            <div class="flex items-center justify-end gap-2 mt-6">
              <button
                class="px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-50"
                :disabled="removing"
                @click="closeConfirm"
              >
                返回
              </button>
              <button
                class="px-4 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
                :disabled="removing"
                @click="confirmRemove"
              >
                {{ removing ? '取消中…' : '确认取消' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { BookmarkItem } from '~/types'
import { useBookmarks } from '~/composables/useBookmarks'
import { extractErrorMessage } from '~/composables/api'

const toast = useToast()
const { isLoggedIn, openLogin } = useAuth()
const { items, total, totalPages, loading, loadBookmarks, toggleBookmark } = useBookmarks()

const page = ref(1)

// 取消收藏二次确认：confirmTarget 非空即弹窗，确认后才真正移除（防误触）
const confirmTarget = ref<BookmarkItem | null>(null)
const removing = ref(false)

// 登录态恢复后加载
watch(isLoggedIn, (v) => {
  if (v) {
    page.value = 1
    loadBookmarks(1)
  }
}, { immediate: true })

function handlePageChange(newPage: number) {
  page.value = newPage
  loadBookmarks(newPage)
}

function closeConfirm() {
  if (!removing.value) confirmTarget.value = null
}

async function confirmRemove() {
  const b = confirmTarget.value
  if (!b || removing.value) return
  removing.value = true
  try {
    await toggleBookmark(b.post.id, true)
    // 从列表移除 + 更新总数（取消收藏是私密操作，直接移除该项）
    items.value = items.value.filter((it) => it.post.id !== b.post.id)
    total.value = Math.max(0, total.value - 1)
    confirmTarget.value = null
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '取消收藏失败'), color: 'error' })
  } finally {
    removing.value = false
  }
}
</script>

<style scoped>
/* 取消收藏确认弹窗动画（与 AuthModal 同款）：遮罩淡入 + 卡片上浮缩放入场 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>
