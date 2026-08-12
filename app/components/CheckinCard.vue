<template>
  <div class="mx-4 mt-5 pt-4 border-t border-zinc-800">
    <!-- 标题 + 连续天数 -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs text-zinc-500">📅 每日签到</span>
      <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
        🔥 连续 {{ status.streak }} 天
      </span>
    </div>

    <!-- 最近 7 天迷你日历 -->
    <div class="flex justify-between mb-2">
      <div
        v-for="d in week"
        :key="d.date"
        class="w-6 h-6 flex items-center justify-center text-[10px] rounded-full transition-colors"
        :class="dayCellClass(d)"
        :title="d.date"
      >
        {{ d.day }}
      </div>
    </div>

    <!-- 今日可得 / 已签 -->
    <div class="text-[11px] text-zinc-500 mb-2">
      <template v-if="status.checkedToday">
        今日已签，得 <span class="text-emerald-400 font-medium">+{{ status.todayDelta }}</span> 鸡腿
      </template>
      <template v-else>
        签到可得 <span class="text-emerald-400 font-medium">+{{ status.todayDelta }}</span> 鸡腿
      </template>
    </div>

    <!-- 签到按钮（未登录 → 弹登录框） -->
    <button
      class="w-full py-1.5 text-xs rounded-md transition-colors"
      :class="status.checkedToday
        ? 'bg-zinc-700/40 text-zinc-500 cursor-default'
        : 'bg-blue-500 hover:bg-blue-600 text-white'"
      :disabled="status.checkedToday || submitting"
      @click="doCheckin"
    >
      {{ submitting ? '签到中…' : status.checkedToday ? '今日已签到 ✓' : '立即签到' }}
    </button>

    <!-- 完整日历入口 -->
    <NuxtLink
      to="/checkin"
      class="block text-center text-[11px] text-zinc-600 hover:text-zinc-400 mt-2 transition-colors"
    >
      完整日历 →
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { CheckinStatus } from '~/types'
import { dateKey, monthKey } from '~/utils/date'

const { isLoggedIn, openLogin, restoreSession } = useAuth()
const toast = useToast()

// 今天作为静态锚点（组件内固定，避免跨天渲染跳动）
const today = new Date()
const todayKey = dateKey(today)

const status = ref<CheckinStatus>({
  streak: 0,
  totalDays: 0,
  checkedToday: false,
  todayDelta: 0,
  calendar: [],
})
/** 已签日期集合（本月 + 必要时上月），用 Set 加速判定 */
const checkedDates = ref<Set<string>>(new Set())
const submitting = ref(false)

/** 最近 7 天（今天往前 6 天） */
const week = computed(() => {
  const days: { date: string; day: number; inMonth: boolean }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    days.push({ date: dateKey(d), day: d.getDate(), inMonth: d.getMonth() === today.getMonth() })
  }
  return days
})

/** 直接调 API 查签到状态（不通过 composable，减少间接层） */
async function fetchStatus(month?: string): Promise<CheckinStatus> {
  const res = await $fetch<{ success: boolean; data: CheckinStatus }>('/api/checkin/status', {
    query: month ? { month } : undefined,
  })
  return res.data
}

/** 直接调 API 执行签到 */
async function fetchCheckin(): Promise<{ delta: number; streak: number; totalDays: number }> {
  const res = await $fetch<{ success: boolean; data: { delta: number; streak: number; totalDays: number } }>(
    '/api/checkin',
    { method: 'POST' }
  )
  return res.data
}

/** 已登录后拉取状态；跨月时补拉上月日历补全最近 7 天 */
async function load() {
  if (!isLoggedIn.value) return
  try {
    const s = await fetchStatus()
    status.value = s
    checkedDates.value = new Set(s.calendar)

    // 最近 7 天若跨到上月，补拉上月日历，避免月初前几日误显示为未签
    const first = week.value[0]
    if (first && !first.inMonth) {
      const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const prevStatus = await fetchStatus(monthKey(prev))
      prevStatus.calendar.forEach((d) => checkedDates.value.add(d))
    }
  } catch {
    // 未登录 / 网络错误：静默，卡片显示默认态
  }
}

/** 日期格样式：已签 → 绿色；今天 → 蓝色描边；其余 → 暗色 */
function dayCellClass(d: { date: string; inMonth: boolean }): string {
  if (checkedDates.value.has(d.date)) return 'bg-emerald-500/20 text-emerald-400'
  if (d.date === todayKey) return 'bg-blue-500/30 text-blue-300 ring-1 ring-blue-400'
  return 'bg-zinc-800 text-zinc-600'
}

/** 执行签到；成功后刷新状态，并同步全局用户积分余额 */
async function doCheckin() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  if (status.value.checkedToday || submitting.value) return

  submitting.value = true
  try {
    const res = await fetchCheckin()
    toast.add({ title: `签到成功 +${res.delta} 鸡腿，连续 ${res.streak} 天`, color: 'success' })
    await refreshAfterChange()
  } catch (err: any) {
    const msg = err?.data?.error?.message || err?.message || '签到失败'
    toast.add({ title: msg, color: 'error' })
    await load()
  } finally {
    submitting.value = false
  }
}

/** 签到/发帖/评论都会改积分，刷新签到状态并同步全局 authUser.points */
async function refreshAfterChange() {
  await Promise.all([load(), restoreSession()])
}

// 登录状态变化（弹窗登录成功）后自动拉取
watch(isLoggedIn, (v) => {
  if (v) load()
})

if (import.meta.client) {
  load()
}
</script>
