<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <!-- 未登录：登录引导（资料接口需登录，与 /my/posts 同策略） -->
    <div v-if="!isLoggedIn" class="panel p-10 text-center">
      <p class="text-sm text-zinc-600 mb-4">登录后查看用户资料</p>
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

    <!-- 用户不存在 -->
    <div v-else-if="!profile" class="panel p-10 text-center">
      <p class="text-zinc-600 text-sm mb-3">用户不存在</p>
      <NuxtLink to="/" class="text-sm text-blue-600 hover:text-blue-500">返回首页</NuxtLink>
    </div>

    <template v-else>
      <!-- 用户信息卡 -->
      <div class="panel p-6">
        <div class="flex items-start gap-4">
          <div class="flex flex-col items-center gap-2">
            <button
              v-if="isOwnProfile"
              class="relative group cursor-pointer rounded-full transition-shadow hover:ring-2 hover:ring-blue-500/50"
              title="点击更换头像"
              @click="showAvatarPicker = true"
            >
              <Avatar :username="profile?.username" :avatar="profile?.avatar" size="xl" />
              <div class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="text-white text-[10px] font-medium">更换</span>
              </div>
            </button>
            <Avatar v-else :username="profile?.username" :avatar="profile?.avatar" size="xl" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-lg font-semibold text-zinc-900">{{ profile.username }}</span>
              <span class="text-[11px] px-2 py-0.5 rounded font-medium" :class="levelClass">
                {{ levelLabel }}
              </span>
              <span v-if="profile.stars > 0" class="text-[11px] px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-600 font-medium">
                ⭐ {{ profile.stars }}
              </span>
            </div>
            <div class="text-xs text-zinc-500 mt-1">
              注册于 {{ joinedDate }}
            </div>
            <p v-if="profile.bio" class="text-sm text-zinc-600 mt-3 leading-relaxed">{{ profile.bio }}</p>
          </div>
        </div>

        <!-- 统计 -->
        <div class="grid gap-3 mt-6" :class="isOwnProfile ? 'grid-cols-4' : 'grid-cols-3'">
          <div v-if="isOwnProfile" class="text-center p-3 rounded-lg bg-zinc-100">
            <div class="text-xl font-bold text-emerald-600">🍗 {{ formatCount(profile.points ?? 0) }}</div>
            <div class="text-[11px] text-zinc-500 mt-1">鸡腿余额</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-zinc-100">
            <div class="text-xl font-bold text-zinc-800">{{ formatCount(profile.totalPointsEarned) }}</div>
            <div class="text-[11px] text-zinc-500 mt-1">累计获得</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-zinc-100">
            <div class="text-xl font-bold text-zinc-800">{{ formatCount(profile.postCount) }}</div>
            <div class="text-[11px] text-zinc-500 mt-1">发帖</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-zinc-100">
            <div class="text-xl font-bold text-zinc-800">{{ formatCount(profile.commentCount) }}</div>
            <div class="text-[11px] text-zinc-500 mt-1">评论</div>
          </div>
        </div>

        <!-- 等级进度条 -->
        <div class="mt-5 pt-4 border-t border-zinc-200">
          <div class="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>等级进度 <span class="text-zinc-700">{{ levelLabel }}</span></span>
            <span v-if="profile.levelProgress.nextLevelAt !== null">
              还差 <span class="text-amber-600 font-medium">{{ profile.levelProgress.remaining }}</span> 鸡腿升 {{ nextLevelLabel }}
            </span>
            <span v-else class="text-emerald-600">已满级</span>
          </div>
          <div class="h-2 rounded-full bg-white overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all"
              :style="{ width: levelPercent + '%' }"
            ></div>
          </div>
          <p class="text-[11px] text-zinc-600 mt-2">
            等级由「累计获得鸡腿」决定，消费不降级 [R20]
          </p>
        </div>
      </div>

      <!-- 头像选择弹窗 -->
      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="showAvatarPicker"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            @click.self="showAvatarPicker = false"
          >
            <div class="bg-white border border-zinc-200 rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-zinc-800">更换头像</h3>
                <button
                  class="text-zinc-500 hover:text-zinc-900 transition-colors text-lg leading-none"
                  @click="showAvatarPicker = false"
                >✕</button>
              </div>
              <AvatarPicker
                :current-avatar="profile?.avatar ?? ''"
                @select="handleAvatarSelect"
              />
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- 积分流水（仅本人可见） -->
      <div v-if="isOwnProfile" class="panel p-6">
        <h2 class="text-sm font-medium text-zinc-700 mb-4">🍗 积分流水</h2>

        <div v-if="logLoading" class="py-6 text-center text-sm text-zinc-500">流水加载中…</div>
        <div v-else-if="logItems.length === 0" class="py-8 text-center text-sm text-zinc-600">
          还没有积分记录，去签到 / 发帖 / 评论赚鸡腿吧～
        </div>
        <div v-else class="divide-y divide-zinc-200/50">
          <div v-for="item in logItems" :key="item.id" class="flex items-center justify-between py-3">
            <div>
              <div class="text-sm text-zinc-700">
                {{ pointTypeLabel(item.type) }}
                <span v-if="item.refId" class="text-zinc-600 text-xs ml-1">#{{ item.refId }}</span>
              </div>
              <div class="text-[11px] text-zinc-600 mt-0.5">{{ logTime(item.createdAt) }}</div>
            </div>
            <div class="text-right">
              <span class="text-emerald-600 font-medium text-sm">+{{ item.delta }}</span>
              <div class="text-[11px] text-zinc-600 mt-0.5">余额 {{ item.balanceAfter }}</div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="logTotalPages > 1" class="flex justify-center mt-4">
          <Pagination :current-page="logPage" :total-pages="logTotalPages" @page-change="handlePageChange" />
        </div>
      </div>
    </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PointLogItem, UserProfile } from '~/types'
import { PointTypeLabel, UserLevelLabel } from '~/types'
import { formatCount, levelBadgeClassFor } from '~/utils/format'
import { useUserProfile } from '~/composables/useUserProfile'
import { extractErrorMessage } from '~/composables/api'

const route = useRoute()
const toast = useToast()
const { user, isLoggedIn, openLogin, updateUser } = useAuth()

const userId = Number(route.params.id)
// 非法/越界 id 直接视为不存在，避免向 /api/users/NaN 发无效请求
const userIdValid = Number.isInteger(userId) && userId > 0

const { getProfile, getPointsLog, updateAvatar } = useUserProfile()

// ── 资料（需登录；SSR 未登录 401 返回 null，登录后重拉） ──
const { data: profile, pending, refresh: refreshProfile } = useAsyncData<UserProfile | null>(
  `user-profile-${userId}`,
  () => (userIdValid ? getProfile(userId).catch(() => null) : Promise.resolve(null))
)

// 登录态从 null → 有值时重新拉资料。
// 仅在资料尚未加载成功时补拉（SSR 未登录 401 后登录成功），已有数据时跳过避免重复请求
watch(isLoggedIn, (v) => {
  if (v && !profile.value) refreshProfile()
})

// ── 头像选择 ──
const showAvatarPicker = ref(false)

/** 当前用户是否在查看自己的资料 */
const isOwnProfile = computed(() => isLoggedIn.value && user.value?.id === userId)

async function handleAvatarSelect(avatar: string) {
  if (!isLoggedIn.value) return
  try {
    const newAvatar = await updateAvatar(avatar)
    // 更新全局 auth 状态（AppHeader 等会即时响应）
    updateUser({ avatar: newAvatar })
    // 替换整个 profile 对象触发 useAsyncData ref 的响应式更新
    if (profile.value) {
      profile.value = { ...profile.value, avatar: newAvatar }
    }
    showAvatarPicker.value = false
    toast.add({ title: '头像已更新', color: 'success' })
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '更新失败'), color: 'error' })
  }
}

// ── 积分流水（分页，客户端加载） ──
const logItems = ref<PointLogItem[]>([])
const logPage = ref(1)
const logTotalPages = ref(0)
const logLoading = ref(false)

async function loadLog(page = 1) {
  logLoading.value = true
  try {
    const res = await getPointsLog(userId, page, 20)
    logItems.value = res.items
    logTotalPages.value = res.totalPages
    logPage.value = res.page
  } catch {
    logItems.value = []
    logTotalPages.value = 0
  } finally {
    logLoading.value = false
  }
}

function handlePageChange(page: number) {
  loadLog(page)
}

// 积分流水仅本人可见：登录且是本人时加载
watch(isOwnProfile, (own) => {
  if (own) loadLog(1)
}, { immediate: true })

// ── 展示辅助 ──
const levelClass = computed(() => levelBadgeClassFor(profile.value?.level))
const levelLabel = computed(() => UserLevelLabel[profile.value?.level ?? ''] ?? profile.value?.level ?? '')
const nextLevelLabel = computed(() => {
  const next = profile.value?.levelProgress.nextLevelAt
  if (next === null || next === undefined) return ''
  // 按门槛反推下一等级：500 → 鸡肉；100 → 鸡腿
  return next >= 500 ? '鸡肉' : next >= 100 ? '鸡腿' : '鸡爪'
})

/** 等级进度条百分比：当前累计 / 下一门槛 */
const levelPercent = computed(() => {
  const p = profile.value?.levelProgress
  if (!p) return 0
  if (p.nextLevelAt === null) return 100
  // 以 0→下一门槛 为满刻度；对 claw(0) 起步按 0 处理
  const total = p.nextLevelAt
  const progress = Math.min(100, Math.max(0, (profile.value!.totalPointsEarned / total) * 100))
  return Math.round(progress)
})

const joinedDate = computed(() => {
  if (!profile.value) return ''
  return new Date(profile.value.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
})

function pointTypeLabel(type: string): string {
  return PointTypeLabel[type] ?? type
}

function logTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
