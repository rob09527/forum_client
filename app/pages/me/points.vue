<template>
  <div class="max-w-4xl mx-auto space-y-4">
    <!-- tips 轮播 -->
    <TipsBanner />

    <!-- 未登录提示 -->
    <div v-if="!isLoggedIn" class="panel p-10 text-center">
      <p class="text-sm text-zinc-600 mb-4">登录后查看积分信息</p>
      <button class="btn btn-primary px-4 py-1.5 text-sm" @click="openLogin">
        登录
      </button>
    </div>

    <template v-else>
      <!-- 积分流水主面板 -->
      <div class="panel overflow-hidden">
        <!-- 标题栏 -->
        <div class="flex items-center justify-between px-5 py-3 border-b border-zinc-200 bg-white/60">
          <h1 class="text-sm font-medium text-zinc-700 inline-flex items-center gap-1.5">
            <AppIcon name="scroll" :size="14" /> 积分流水
          </h1>
        </div>

        <!-- 资产总览 -->
        <div class="px-5 py-4 bg-zinc-50/50 border-b border-zinc-200">
          <div class="flex items-center justify-between gap-4 text-center sm:text-left">
            <!-- 当前余额 -->
            <div class="flex-1">
              <div class="text-xs text-zinc-500 mb-1">余额</div>
              <div class="text-2xl font-bold text-zinc-900 tabular-nums">{{ formatCount(balance) }}</div>
            </div>
            <!-- 累计获得 -->
            <div class="flex-1">
              <div class="text-xs text-zinc-500 mb-1">累计获得</div>
              <div class="text-base font-semibold text-zinc-700 tabular-nums">{{ formatCount(totalEarned) }}</div>
            </div>
            <!-- 累计消费 -->
            <div class="flex-1">
              <div class="text-xs text-zinc-500 mb-1">累计消费</div>
              <div class="text-base font-semibold text-zinc-700 tabular-nums">{{ formatCount(totalSpent) }}</div>
            </div>
          </div>
        </div>

        <!-- 筛选Tab -->
        <div class="flex border-b border-zinc-200 px-5 overflow-x-auto scrollbar-hide">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="px-4 py-3 text-sm transition-colors whitespace-nowrap shrink-0"
            :class="activeTab === tab.value ? 'text-zinc-900 border-b-2 border-zinc-900 font-medium -mb-px' : 'text-zinc-500 hover:text-zinc-900'"
            @click="switchTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 加载中 -->
        <div v-if="loading" class="p-10 text-center text-sm text-zinc-500">
          加载中…
        </div>

        <!-- 空状态 -->
        <div v-else-if="items.length === 0" class="p-10 text-center">
          <p class="text-sm text-zinc-600">{{ emptyText }}</p>
        </div>

        <!-- 流水列表 -->
        <div v-else class="divide-y divide-zinc-100">
          <div
            v-for="item in items"
            :key="item.id"
            class="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors"
          >
            <div class="flex-1 min-w-0 pr-4">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-medium text-zinc-800">{{ getTypeLabel(item.type) }}</span>
                <span v-if="item.refId" class="text-xs text-zinc-400 font-mono">#{{ item.refId }}</span>
              </div>
              <div class="text-xs text-zinc-500">{{ formatTime(item.createdAt) }}</div>
            </div>

            <div class="text-right shrink-0">
              <div
                class="text-base font-semibold tabular-nums mb-0.5"
                :class="item.delta > 0 ? 'text-emerald-600' : 'text-red-600'"
              >
                {{ item.delta > 0 ? '+' : '' }}{{ item.delta }}
              </div>
              <div class="text-xs text-zinc-400">余{{ item.balanceAfter }}</div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="p-4 border-t border-zinc-200 flex justify-center">
          <Pagination :current-page="page" :total-pages="totalPages" @page-change="handlePageChange" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PointLogItem } from '~/types'
import { PointTypeLabel } from '~/types'
import { formatCount } from '~/utils/format'
import { useUserProfile } from '~/composables/useUserProfile'
import { usePoints } from '~/composables/usePoints'

const { user, isLoggedIn, openLogin } = useAuth()
const { balance } = usePoints()
const { getPointsLog } = useUserProfile()
const toast = useToast()

// Tab切换
type TabValue = 'all' | 'income' | 'expense'
const activeTab = ref<TabValue>('all')
const tabs = [
  { label: '全部', value: 'all' as TabValue },
  { label: '收入', value: 'income' as TabValue },
  { label: '支出', value: 'expense' as TabValue },
]

function switchTab(tab: TabValue) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  page.value = 1
  loadLog()
}

// 流水数据
const items = ref<PointLogItem[]>([])
const page = ref(1)
const totalPages = ref(0)
const loading = ref(false)

// 累计数据
const totalEarned = computed(() => {
  return user.value?.totalPointsEarned ?? 0
})
const totalSpent = computed(() => {
  return totalEarned.value - balance.value
})

const emptyText = computed(() => {
  if (activeTab.value === 'income') return '还没有收入记录'
  if (activeTab.value === 'expense') return '还没有支出记录'
  return '还没有积分记录'
})

/**
 * 加载积分流水
 * 注意：当前实现在前端过滤，实际生产环境应由后端支持 type 参数筛选，避免传输无关数据
 */
async function loadLog() {
  if (!user.value) return

  loading.value = true
  try {
    const res = await getPointsLog(user.value.id, page.value, 20)

    // TODO: 后端应支持 ?type=income|expense 参数，避免前端过滤
    // 当前为临时方案：前端过滤，适用于数据量小的场景
    let filtered = res.items
    if (activeTab.value === 'income') {
      filtered = res.items.filter(item => item.delta > 0)
    } else if (activeTab.value === 'expense') {
      filtered = res.items.filter(item => item.delta < 0)
    }

    items.value = filtered
    totalPages.value = res.totalPages
  } catch {
    items.value = []
    totalPages.value = 0
    toast.add({ title: '加载失败', color: 'error' })
  } finally {
    loading.value = false
  }
}

function handlePageChange(newPage: number) {
  page.value = newPage
  loadLog()
}

function getTypeLabel(type: string): string {
  return PointTypeLabel[type] ?? type
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 登录后加载
watch(isLoggedIn, (v) => {
  if (v) loadLog()
}, { immediate: true })

// SEO
useHead({
  title: '积分流水 - Forum 论坛',
  meta: [
    { name: 'description', content: '查看我的积分余额、收支记录和积分流水' }
  ]
})
</script>

<style scoped>
/* 隐藏横向滚动条 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
