<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <!-- 未登录：登录引导（资料接口需登录，与 /my/posts 同策略） -->
    <div v-if="!isLoggedIn" class="panel p-10 text-center">
      <p class="text-sm text-zinc-600 mb-4">登录后查看用户资料</p>
      <button class="btn btn-primary px-4 py-1.5 text-sm" @click="openLogin">
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
              <!-- 全站统一用户名渲染（装饰自动生效；他人资料装饰同样展示） -->
              <UsernameText :author="profile" size="lg" />
              <!-- 修改用户名（仅本人视角，改名道具 [1.4.3][3.6]）；图标按钮，悬停显示说明 -->
              <button
                v-if="isOwnProfile"
                class="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors inline-flex items-center justify-center"
                title="修改用户名"
                @click="openRename"
              >
                <AppIcon name="edit" :size="13" />
              </button>
              <!-- 关注按钮（仅他人视角） -->
              <button
                v-if="!isOwnProfile"
                class="text-xs px-3 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                :class="following ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' : 'bg-blue-500 hover:bg-blue-600 text-white'"
                @click="handleToggleFollow"
              >
                {{ following ? '已关注' : '+ 关注' }}
              </button>
              <!-- 发私信（仅他人视角；弹出浮动聊天窗） -->
              <button
                v-if="!isOwnProfile"
                class="text-xs px-3 py-1 rounded-md transition-colors bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                @click="handleMessage"
              >
                私信
              </button>
              <span v-if="profile.stars > 0" class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-600 font-medium">
                <AppIcon name="star" :size="11" /> {{ profile.stars }}
              </span>
            </div>
            <div class="text-xs text-zinc-500 mt-1">
              注册于 {{ joinedDate }}
            </div>
            <p v-if="profile.bio" class="text-sm text-zinc-600 mt-3 leading-relaxed">{{ profile.bio }}</p>
          </div>
        </div>

        <!-- 统计 -->
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6">
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
          <!-- 关注 / 粉丝（点击跳转关系页；他人主页也能看对方的关系数） -->
          <NuxtLink to="/following?tab=following" class="text-center p-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors block">
            <div class="text-xl font-bold text-zinc-800">{{ formatCount(profile.followingCount) }}</div>
            <div class="text-[11px] text-zinc-500 mt-1">关注</div>
          </NuxtLink>
          <NuxtLink to="/following?tab=followers" class="text-center p-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors block">
            <div class="text-xl font-bold text-zinc-800">{{ formatCount(profile.followerCount) }}</div>
            <div class="text-[11px] text-zinc-500 mt-1">粉丝</div>
          </NuxtLink>
        </div>

        <!-- 等级进度条 -->
        <div class="mt-5 pt-4 border-t border-zinc-200">
          <!-- 窄屏两段文案可能挤：gap-2 + 右侧 text-right，长文案折行也不与左侧重叠 -->
          <div class="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-2">
            <span class="shrink-0">等级进度 <span class="text-zinc-700">{{ levelLabel }}</span></span>
            <span v-if="profile.levelProgress.nextLevelAt !== null" class="text-right">
              还差 <span class="text-amber-600 font-medium tabular-nums">{{ profile.levelProgress.remaining }}</span> 鸡腿升至「{{ nextLevelLabel }}」
            </span>
            <span v-else class="text-emerald-600 shrink-0">已满级</span>
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

      <!-- 头像选择弹窗（统一弹窗封装） -->
      <AppModal v-model="showAvatarPicker" title="更换头像" width="lg">
        <AvatarPicker
          :current-avatar="profile?.avatar ?? ''"
          @select="handleAvatarSelect"
        />
      </AppModal>

      <!-- 改名弹窗（统一弹窗封装；输入 + 实时唯一性 + 消耗提示）[1.4.3][3.6] -->
      <AppModal v-model="showRename" title="修改用户名" width="md">
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-zinc-600 mb-1.5">新用户名</label>
            <input
              v-model="renameName"
              type="text"
              maxlength="20"
              placeholder="3~20 个字符"
              class="w-full bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
              @input="onRenameInput"
            />
            <p class="text-xs mt-1" :class="renameHint.class">{{ renameHint.text }}</p>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-zinc-600">
              消耗 <span class="text-amber-600 font-medium">🍗 {{ renamePrice }}</span>，
              当前余额 <span class="font-mono tabular-nums text-zinc-700">{{ balance }}</span>
            </span>
            <span v-if="balance < renamePrice" class="text-xs text-red-600">余额不足</span>
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <button class="btn btn-ghost px-4 py-1.5 text-sm" @click="showRename = false">取消</button>
            <button
              class="btn btn-primary px-4 py-1.5 text-sm"
              :disabled="!renameReady || renaming"
              @click="doRename"
            >
              {{ renaming ? '提交中…' : `确认改名 · ${renamePrice}🍗` }}
            </button>
          </div>
        </div>
      </AppModal>

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
import { PointTypeLabel } from '~/types'
import { formatCount } from '~/utils/format'
import { useUserProfile } from '~/composables/useUserProfile'
import { useFollow } from '~/composables/useFollow'
import { useRename } from '~/composables/useRename'
import { usePoints } from '~/composables/usePoints'
import { extractErrorMessage } from '~/composables/api'
import { useGameConfig } from '~/composables/useGameConfig'

const route = useRoute()
const toast = useToast()
const { user, isLoggedIn, openLogin, updateUser } = useAuth()

const userId = Number(route.params.id)
// 非法/越界 id 直接视为不存在，避免向 /api/users/NaN 发无效请求
const userIdValid = Number.isInteger(userId) && userId > 0

const { getProfile, getPointsLog, updateAvatar } = useUserProfile()
const { toggleFollow } = useFollow()
const { openChat } = useMessages()

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

// ── 改名道具 [1.4.3][3.6]：输入 + 实时唯一性检查（debounce）+ 消耗提示 ──
const { rename, renamePrice, checkAvailable } = useRename()
const { balance } = usePoints()

const showRename = ref(false)
const renameName = ref('')
const renameChecking = ref(false)
/** 实时唯一性结果：null=未检查/检查失败（提交时后端复检），true/false=可用/占用 */
const renameAvailable = ref<boolean | null>(null)
const renaming = ref(false)

function openRename() {
  renameName.value = profile.value?.username ?? ''
  renameAvailable.value = null
  showRename.value = true
}

/** 实时唯一性检查：300ms debounce，避免每次击键都打接口 */
let renameTimer: ReturnType<typeof setTimeout> | undefined
function onRenameInput() {
  clearTimeout(renameTimer)
  renameTimer = setTimeout(checkRenameName, 300)
}
async function checkRenameName() {
  const name = renameName.value.trim()
  if (name.length < 3 || name.length > 20) {
    renameAvailable.value = null
    return
  }
  renameChecking.value = true
  try {
    renameAvailable.value = await checkAvailable(name)
  } catch {
    renameAvailable.value = null // 检查接口失败不阻塞提交（后端复检兜底）
  } finally {
    renameChecking.value = false
  }
}

const renameHint = computed(() => {
  const name = renameName.value.trim()
  if (name === (profile.value?.username ?? '')) {
    return { text: '用户名未变化', class: 'text-zinc-400' }
  }
  if (name.length < 3 || name.length > 20) {
    return { text: '用户名需 3~20 个字符', class: 'text-red-600' }
  }
  if (renameChecking.value) return { text: '检查中…', class: 'text-zinc-400' }
  if (renameAvailable.value === false) return { text: '该用户名已被占用', class: 'text-red-600' }
  if (renameAvailable.value === true) return { text: '该用户名可用 ✓', class: 'text-emerald-600' }
  return { text: '输入后自动检查是否可用', class: 'text-zinc-400' }
})

const renameReady = computed(() => {
  const name = renameName.value.trim()
  return name.length >= 3 && name.length <= 20
    && name !== (profile.value?.username ?? '')
    && renameAvailable.value === true
    && balance.value >= renamePrice.value
})

async function doRename() {
  const name = renameName.value.trim()
  renaming.value = true
  try {
    await rename(name)
    showRename.value = false
    // 资料卡用户名即时更新（authUser 已由 useRename 同步，全站响应式）
    if (profile.value) profile.value = { ...profile.value, username: name }
    toast.add({ title: '用户名已更新', color: 'success' })
  } catch (err: any) {
    // RENAME_COOLDOWN / USERNAME_TAKEN 后端分别给了明确中文文案，直接透出
    toast.add({ title: extractErrorMessage(err, '改名失败'), color: 'error' })
  } finally {
    renaming.value = false
  }
}

/** 当前用户是否在查看自己的资料 */
const isOwnProfile = computed(() => isLoggedIn.value && user.value?.id === userId)

// ── 关注（后端 profile 返回 isFollowing 作初始值，切换后本地维护 + 同步计数） ──
const following = ref(false)

watchEffect(() => {
  if (profile.value) {
    following.value = profile.value.isFollowing
  }
})

async function handleToggleFollow() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  try {
    const next = await toggleFollow(userId, following.value)
    following.value = next
    // 同步资料卡的粉丝数
    if (profile.value) {
      profile.value.followerCount = Math.max(0, profile.value.followerCount + (next ? 1 : -1))
      profile.value.isFollowing = next
    }
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '操作失败'), color: 'error' })
  }
}

/** 发起私信：弹出浮动聊天窗（建立会话 + 加载消息；对方隐私门槛由后端拦截并透出文案） */
async function handleMessage() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  try {
    await openChat(userId)
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '无法发起私信'), color: 'error' })
  }
}

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
// 等级名与下一等级名均来自后台配置（零硬编码）
const { levelName, levels } = useGameConfig()
const levelLabel = computed(() => levelName(profile.value?.level))
const nextLevelLabel = computed(() => {
  const next = profile.value?.levelProgress.nextLevelAt
  if (next === null || next === undefined) return ''
  // 下一等级名按门槛反查配置；未命中回退空
  return levels.value.find((l) => l.minTotal === next)?.name ?? ''
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
