<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <!-- 未登录提示 -->
    <div v-if="!isLoggedIn" class="panel p-10 text-center">
      <p class="text-lg text-zinc-700 mb-2 inline-flex items-center gap-1.5"><AppIcon name="calendar" :size="17" /> 每日签到</p>
      <p class="text-sm text-zinc-500 mb-4">登录后才能签到打卡</p>
      <button
        class="px-5 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        @click="openLogin"
      >
        立即登录
      </button>
    </div>

    <template v-else>
      <!-- 顶部统计 -->
      <div class="panel p-6">
        <div class="flex items-center justify-between mb-5">
          <h1 class="text-lg font-semibold text-zinc-900 inline-flex items-center gap-1.5">
            <AppIcon name="calendar" :size="18" /> 每日签到
          </h1>
          <button
            class="px-4 py-1.5 text-sm rounded-md transition-colors"
            :class="status.checkedToday
              ? 'bg-zinc-100 text-zinc-500 cursor-default'
              : 'bg-blue-500 hover:bg-blue-600 text-white'"
            :disabled="status.checkedToday || submitting"
            @click="doCheckin"
          >
            {{ submitting ? '签到中…' : status.checkedToday ? '今日已签到 ✓' : '立即签到' }}
          </button>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-3 rounded-lg bg-white/70 border border-zinc-200/60">
            <div class="text-2xl font-bold text-amber-600">{{ status.streak }}</div>
            <div class="text-xs text-zinc-500 mt-1">连续签到天数</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-white/70 border border-zinc-200/60">
            <div class="text-2xl font-bold text-zinc-800">{{ status.totalDays }}</div>
            <div class="text-xs text-zinc-500 mt-1">累计签到天数</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-white/70 border border-zinc-200/60">
            <div class="text-2xl font-bold text-emerald-600">+{{ status.todayDelta }}</div>
            <div class="text-xs text-zinc-500 mt-1">{{ status.checkedToday ? '今日已得' : '今日可签得' }}</div>
          </div>
        </div>
      </div>

      <!-- 月历 -->
      <div class="panel p-6">
        <div class="flex items-center justify-between mb-4">
          <button
            class="px-2.5 py-1 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
            @click="prevMonth"
          >
            ← 上一月
          </button>
          <span class="text-sm font-medium text-zinc-700">{{ viewTitle }}</span>
          <button
            class="px-2.5 py-1 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
            :class="canNext ? '' : 'opacity-40 pointer-events-none'"
            @click="nextMonth"
          >
            下一月 →
          </button>
        </div>

        <!-- 星期表头：周一起始 -->
        <div class="grid grid-cols-7 gap-1 mb-1 text-center">
          <div v-for="w in weekdays" :key="w" class="text-[11px] text-zinc-500 py-1">{{ w }}</div>
        </div>
        <!-- 日期格 -->
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="cell in cells"
            :key="cell.key"
            class="aspect-square flex items-center justify-center text-sm rounded-md transition-colors"
            :class="cellClass(cell)"
          >
            <template v-if="cell.day !== null">
              <div class="flex flex-col items-center gap-0.5">
                <span>{{ cell.day }}</span>
                <!-- 补签入口 [1.4.2]：当前月「昨天」未签时显示，一步完成（消耗 makeupPrice🍗） -->
                <button
                  v-if="cell.isYesterday && !cell.checked"
                  class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 transition-colors"
                  @click="showMakeupConfirm = true"
                >
                  补签
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- 图例 -->
        <div class="flex items-center gap-4 mt-4 text-[11px] text-zinc-500">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500/25 ring-1 ring-emerald-500/40"></span>已签到</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-500/25 ring-1 ring-amber-500/40"></span>今天</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-white"></span>未签到</span>
        </div>
      </div>

      <!-- 规则说明 -->
      <div class="panel p-6">
        <h2 class="text-sm font-medium text-zinc-700 mb-3">📜 签到规则</h2>
        <ul class="text-xs text-zinc-500 space-y-2 leading-relaxed">
          <li>① 每日签到 +{{ cfg.base }} 鸡腿</li>
          <li>② 连续签到加成：连续第 N 天额外 +min(N×{{ cfg.streakBonusPerDay }}, {{ cfg.streakBonusCap }})，连续 {{ cfg.streakBonusCap }} 天及以上每天可签得 {{ cfg.base + cfg.streakBonusCap }}</li>
          <li>③ 连续满 {{ cfg.milestoneEvery }} 天里程碑：第 {{ cfg.milestoneEvery }} / {{ cfg.milestoneEvery * 2 }} / … 天额外 +{{ cfg.milestoneBonus }}（第 {{ cfg.milestoneEvery }} 天当天 = {{ cfg.base }} + {{ milestoneStreak }} + {{ cfg.milestoneBonus }} = {{ milestoneDayTotal }}）</li>
          <li>④ 断签连续天数归零，但累计签到天数保留</li>
          <li>⑤ 每人每天限签 1 次</li>
          <li>⑥ 漏签可补签：消耗 {{ makeupPrice }}🍗 补回昨天（前天已签才可补，当月有限次）</li>
        </ul>
      </div>

      <!-- 补签确认（统一弹窗封装，一步完成）[1.4.2] -->
      <ConfirmModal
        v-model="showMakeupConfirm"
        title="补签昨天"
        :message="`补签昨天需消耗 ${makeupPrice}🍗，将补回昨天的签到记录（含连续天数）。确定补签吗？`"
        confirm-text="补签"
        :loading="makeupSubmitting"
        @confirm="doMakeup"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CheckinStatus } from '~/types'
import { dateKey, monthKey } from '~/utils/date'
import { extractErrorMessage } from '~/composables/api'
import { useGameConfig } from '~/composables/useGameConfig'
import { useMakeup } from '~/composables/useMakeup'

const { isLoggedIn, openLogin, restoreSession } = useAuth()
const { getStatus, checkin: submitCheckin } = useCheckin()
const { makeup, makeupPrice } = useMakeup()
const toast = useToast()

const weekdays = ['一', '二', '三', '四', '五', '六', '日']

// 签到规则文案来自后台配置（未配置/未加载时用默认值）
const { checkinConfig } = useGameConfig()
const cfg = computed(() => checkinConfig.value)
/** 里程碑当天的基础连签加成（规则示例用） */
const milestoneStreak = computed(() =>
  Math.min(cfg.value.milestoneEvery * cfg.value.streakBonusPerDay, cfg.value.streakBonusCap)
)
/** 里程碑当天总所得（规则示例用） */
const milestoneDayTotal = computed(() => cfg.value.base + milestoneStreak.value + cfg.value.milestoneBonus)

// 锚点：今天固定（避免跨天渲染跳动）
const today = new Date()
const todayKey = dateKey(today)
/** 「昨天」固定锚点（补签入口 [1.4.2]：只补昨天） */
const yesterdayKey = dateKey(new Date(today.getTime() - 86400_000))

const status = ref<CheckinStatus>({
  streak: 0,
  totalDays: 0,
  checkedToday: false,
  todayDelta: 0,
  calendar: [],
})
const submitting = ref(false)

/** 每个月的已签日期缓存（key: YYYY-MM），翻月不再重复请求 */
const monthCache = new Map<string, Set<string>>()
/** 当前查看的月份 */
const viewMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))

const viewTitle = computed(() => `${viewMonth.value.getFullYear()} 年 ${viewMonth.value.getMonth() + 1} 月`)
/** 下一月不能越过当前月（不能预签未来） */
const canNext = computed(() => {
  return viewMonth.value.getFullYear() < today.getFullYear()
    || (viewMonth.value.getFullYear() === today.getFullYear() && viewMonth.value.getMonth() < today.getMonth())
})

/** 日历格：前导空格 + 当月日期，标注已签/今天 */
const cells = computed(() => {
  const y = viewMonth.value.getFullYear()
  const m = viewMonth.value.getMonth()
  const firstDay = new Date(y, m, 1).getDay() // 0=周日，转周一起始
  const leading = (firstDay + 6) % 7
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const key = monthKey(viewMonth.value)
  const checked = monthCache.get(key) ?? new Set<string>()

  const cells: {
    key: string
    date: string
    day: number | null
    checked: boolean
    isToday: boolean
    /** 昨天（补签入口只挂在当前月「昨天」格 [1.4.2]） */
    isYesterday: boolean
  }[] = []
  for (let i = 0; i < leading; i++) {
    cells.push({ key: `pad-${i}`, date: '', day: null, checked: false, isToday: false, isYesterday: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      key: date,
      date,
      day: d,
      checked: checked.has(date),
      isToday: date === todayKey,
      isYesterday: date === yesterdayKey,
    })
  }
  return cells
})

function cellClass(cell: { day: number | null; checked: boolean; isToday: boolean }): string {
  if (cell.day === null) return ''
  if (cell.checked) return 'bg-emerald-500/20 text-emerald-600'
  if (cell.isToday) return 'bg-amber-500/25 text-amber-700 ring-1 ring-amber-500/40'
  return 'bg-white/70 text-zinc-500 hover:bg-white'
}

/** 拉取某月日历；当前月同时刷新统计 */
async function loadMonth(m: Date) {
  const key = monthKey(m)
  if (monthCache.has(key)) return
  try {
    const s = await getStatus(key)
    monthCache.set(key, new Set(s.calendar))
    if (key === monthKey(today)) status.value = s
  } catch (err: any) {
    // 失败要可见：静默吞错会让整个月表现为全部未签，用户无从得知
    console.warn(`[checkin] 拉取 ${key} 日历失败`, err)
    toast.add({ title: extractErrorMessage(err, '加载日历失败'), color: 'error' })
  }
}

function prevMonth() {
  viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() - 1, 1)
  loadMonth(viewMonth.value)
}

function nextMonth() {
  if (!canNext.value) return
  viewMonth.value = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + 1, 1)
  loadMonth(viewMonth.value)
}

/** 执行签到；成功后刷新，并同步全局用户积分余额 */
async function doCheckin() {
  if (status.value.checkedToday || submitting.value) return
  submitting.value = true
  try {
    const res = await submitCheckin()
    toast.add({ title: `签到成功 +${res.delta} 鸡腿，连续 ${res.streak} 天`, color: 'success' })
    monthCache.clear() // 状态变了，清缓存重新拉
    await Promise.all([loadMonth(viewMonth.value), restoreSession()])
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '签到失败'), color: 'error' })
    monthCache.clear()
    await loadMonth(viewMonth.value)
  } finally {
    submitting.value = false
  }
}

// ── 补签（一步完成；useMakeup 内部已按铁律 [3.1] 同步余额）[1.4.2] ──
const showMakeupConfirm = ref(false)
const makeupSubmitting = ref(false)
async function doMakeup() {
  makeupSubmitting.value = true
  try {
    await makeup()
    showMakeupConfirm.value = false
    toast.add({ title: `补签成功，已补回昨天（消耗 ${makeupPrice.value}🍗）`, color: 'success' })
    monthCache.clear() // 状态变了，清缓存重新拉
    await Promise.all([loadMonth(viewMonth.value), restoreSession()])
  } catch (err: any) {
    // MAKEUP_UNAVAILABLE / MAKEUP_LIMIT_EXCEEDED：toast 说明原因
    toast.add({ title: extractErrorMessage(err, '补签失败'), color: 'error' })
    monthCache.clear()
    await loadMonth(viewMonth.value)
  } finally {
    makeupSubmitting.value = false
  }
}

// 首次加载 + 登录状态变化后加载
watch(isLoggedIn, (v) => {
  if (v) {
    monthCache.clear()
    loadMonth(viewMonth.value)
  }
})

if (import.meta.client) {
  loadMonth(viewMonth.value)
}
</script>
