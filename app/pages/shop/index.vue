<template>
  <div class="max-w-5xl mx-auto space-y-4">
    <!-- tips 轮播 -->
    <TipsBanner />

    <!-- 到期提醒横幅 [1.3.4] -->
    <ShopBanner v-if="expiringSoon.length" :items="expiringSoon" />

    <!-- Tab（URL query 驱动，?tab=mine 直达「我的」；顶部不展示余额）。
         手机端：移除右上角分类按钮，改用商品区域的可点击指示器 -->
    <div class="panel px-5 py-3 flex items-center gap-3">
      <div class="ml-auto flex items-center gap-1">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="px-3.5 py-2 text-sm rounded-md transition-colors inline-flex items-center gap-1.5"
          :class="activeTab === t.value ? 'bg-zinc-200 text-zinc-800 font-medium' : 'text-zinc-600 hover:text-zinc-900'"
          @click="switchTab(t.value)"
        >
          <AppIcon :name="t.icon" :size="13" /> {{ t.label }}
        </button>
      </div>
    </div>

    <!-- ── 装饰 tab ── -->
    <template v-if="activeTab === 'shop'">
      <div v-if="isLoading" class="panel p-10 text-center text-sm text-zinc-500">商城加载中…</div>
      <div v-else-if="error && items.length === 0" class="panel p-10 text-center text-sm text-zinc-500">商城加载失败，请稍后重试</div>
      <div v-else-if="items.length === 0" class="panel p-10 text-center text-sm text-zinc-600">
        商城筹备中，稍后就能用鸡腿换装饰啦～
      </div>
      <!-- 商品网格无条件展示：没鸡腿也能自由浏览（余额不足时点购买自会提示），不做「余额不够就锁住整个商城」的限制 -->
      <!-- 称号 / 颜色 切换子 tab：PC端横向展示，手机端隐藏（改用右上角侧边栏） -->
      <template v-else>
        <!-- PC端：横向分类按钮 -->
        <div class="hidden lg:flex items-center gap-2 px-1">
          <button
            v-for="st in subTabs"
            :key="st.value"
            class="px-3 py-2 text-sm rounded-lg transition-colors inline-flex items-center gap-1"
            :class="subTab === st.value ? 'bg-blue-500 text-white' : 'text-zinc-600 hover:text-zinc-900'"
            @click="switchSubTab(st.value)"
          >
            <AppIcon :name="st.icon" :size="14" /> {{ st.label }}（{{ st.count }}）
          </button>
        </div>

        <!-- 手机端：当前分类指示器 + 点击切换提示 -->
        <div class="lg:hidden px-1 py-2">
          <button
            class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 transition-all"
            @click="drawerOpen = true"
          >
            <div class="flex items-center gap-2">
              <AppIcon :name="currentSubTab.icon" :size="16" class="text-blue-600" />
              <span class="text-sm font-medium text-zinc-800">{{ currentSubTab.label }}</span>
              <span class="text-xs text-zinc-500">（{{ currentSubTab.count }} 件）</span>
            </div>
            <div class="flex items-center gap-1 text-blue-600">
              <span class="text-xs">切换</span>
              <AppIcon name="chevron-right" :size="14" />
            </div>
          </button>
        </div>

        <!-- 每页 6 条（3 列 × 2 行）PC端；手机端 2 列 -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          <ShopItemCard v-for="item in pagedItems" :key="item.id" :item="item" @buy="openBuy(item)" />
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 mt-4">
          <button
            class="px-3 py-1 text-sm rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
            :disabled="page <= 0"
            @click="prevPage"
          >
            <AppIcon name="chevron-left" :size="14" /> 上一页
          </button>
          <span class="text-sm text-zinc-500 inline-flex items-baseline gap-1 tabular-nums">
            <span class="font-semibold text-blue-600">{{ page + 1 }}</span>
            <span>/</span>
            <span>{{ totalPages }}</span>
          </span>
          <button
            class="px-3 py-1 text-sm rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
            :disabled="page >= totalPages - 1"
            @click="nextPage"
          >
            下一页 <AppIcon name="chevron-right" :size="14" />
          </button>
        </div>
      </template>
    </template>

    <!-- ── 我的装饰 tab ── -->
    <template v-else>
      <div v-if="!isLoggedIn" class="panel p-10 text-center text-sm text-zinc-600 mb-4">
        登录后查看我的装饰
      </div>
      <div v-else-if="isMineLoading" class="panel p-10 text-center text-sm text-zinc-500">加载中…</div>
      <div v-else-if="mine.length === 0" class="panel p-10 text-center text-sm text-zinc-600">
        还没买过装饰，去挑一件吧～
      </div>
      <div v-else class="space-y-3">
        <!-- 我的 称号/颜色切换：PC端横向展示，手机端改为竖向列表 -->
        <div class="hidden lg:flex items-center gap-2 px-1">
          <button
            v-for="mt in mineSubTabs"
            :key="mt.value"
            class="px-3 py-2 text-sm rounded-lg transition-colors inline-flex items-center gap-1"
            :class="mineSubTab === mt.value ? 'bg-blue-500 text-white' : 'text-zinc-600 hover:text-zinc-900'"
            @click="switchMineSubTab(mt.value)"
          >
            <AppIcon :name="mt.icon" :size="14" /> {{ mt.label }}（{{ mt.count }}）
          </button>
        </div>

        <!-- 手机端：当前分类指示器 -->
        <div class="lg:hidden flex items-center gap-2 px-1">
          <button
            v-for="mt in mineSubTabs"
            :key="mt.value"
            class="flex-1 px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
            :class="mineSubTab === mt.value ? 'bg-blue-500 text-white font-medium' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'"
            @click="switchMineSubTab(mt.value)"
          >
            <AppIcon :name="mt.icon" :size="14" />
            <span class="hidden sm:inline">{{ mt.label }}</span>
            <span class="sm:hidden">{{ mt.label.replace('专属称号', '称号').replace('用户名颜色', '颜色') }}</span>
            <span class="text-xs opacity-75">({{ mt.count }})</span>
          </button>
        </div>
        <div class="panel p-4">
          <div v-if="mineActiveGroup && mineActiveGroup.items.length" class="space-y-2">
            <MyDecorationItem
              v-for="it in mineActiveGroup.items"
              :key="it.id"
              :item="it"
              @renew="renewItem(it)"
              @switch="switchItem(it)"
            />
          </div>
          <div v-else class="py-8 text-center text-sm text-zinc-500">还没有{{ mineSubLabel }}，去挑一件吧～</div>
        </div>
      </div>
    </template>

    <!-- 购买确认弹窗（试戴预览 + 确认） -->
    <ShopBuyModal v-model="buyModalOpen" :item="buyItem" @bought="onBought" />

    <!-- 手机端分类侧边栏 -->
    <ShopCategoryDrawer
      v-model="drawerOpen"
      :active-category="subTab"
      :categories="subTabs"
      @select="switchSubTab"
    />
  </div>
</template>

<script setup lang="ts">
import type { MyDecorationItem, ShopItem, ShopItemTypeValue } from '~/types'
import { ShopItemTypeLabel } from '~/types'
import { useShop } from '~/composables/useShop'
import { useAuth } from '~/composables/useAuth'
import { extractErrorMessage } from '~/composables/api'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { isLoggedIn, openLogin } = useAuth()
const { items, expiringSoon, mine, isLoading, isMineLoading, error, fetchItems, fetchMine, purchase, activate } = useShop()

/** Tab 态：?tab=mine 直达「我的」 */
const activeTab = computed(() => (route.query.tab === 'mine' ? 'mine' : 'shop'))
const tabs = [
  { label: '装饰', value: 'shop', icon: 'shopping-cart' },
  { label: '我的', value: 'mine', icon: 'palette' },
]

function switchTab(tab: string) {
  if (tab === activeTab.value) return
  router.push({ path: '/shop', query: { ...route.query, tab } })
}

/** 称号区 / 颜色区拆分 [2.2]：业务分区展示，互不冗杂。
 * 头像分区已于 §9.2 下线（头像不再是商品，预置头像在个人资料选择器直接选 + 支持自定义上传）。 */
const titleItems = computed(() => items.value.filter((i) => i.type === 'title'))
const colorItems = computed(() => items.value.filter((i) => i.type === 'username_color'))

/** 称号 / 颜色 子 tab + 分页（每页 6 条 = 3 列 × 2 行）。
 * 默认 'title'：头像分区下线后若仍默认 'avatar' 会打开就是空白页。
 * ?sub= 双向驱动：读时仅接受现存分区（历史链接 ?sub=avatar 回落到 'title'），
 * 切子 tab 时写回 query（replace，不污染历史），支持直达链接与后退键。 */
const PAGE_SIZE = 6
const SUB_TAB_VALUES: ShopItemTypeValue[] = ['title', 'username_color']
const subTab = computed<ShopItemTypeValue>(() => {
  const q = route.query.sub as ShopItemTypeValue | undefined
  return q && SUB_TAB_VALUES.includes(q) ? q : 'title'
})
const page = ref(0)
const subTabs = computed(() => [
  { label: '专属称号', value: 'title' as ShopItemTypeValue, count: titleItems.value.length, icon: 'medal' },
  { label: '用户名颜色', value: 'username_color' as ShopItemTypeValue, count: colorItems.value.length, icon: 'palette' },
])
const currentList = computed(() => (subTab.value === 'title' ? titleItems.value : colorItems.value))
const totalPages = computed(() => Math.max(1, Math.ceil(currentList.value.length / PAGE_SIZE)))
const pagedItems = computed(() => {
  const p = Math.min(page.value, totalPages.value - 1)
  return currentList.value.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE)
})
function switchSubTab(v: ShopItemTypeValue) {
  if (subTab.value === v) return
  router.replace({ path: '/shop', query: { ...route.query, sub: v } })
}
// 子 tab 变化（含后退键触发）时重置分页，避免停留在上一分区的页码
watch(subTab, () => { page.value = 0 })
function prevPage() {
  if (page.value > 0) page.value--
}
function nextPage() {
  if (page.value < totalPages.value - 1) page.value++
}

/** 「我的」tab：称号/颜色切换（同商城分区，不做下拉铺满）。
 * 头像分区随 §9.2 一并下线：头像不再产生持有记录（user_decorations 无 avatar 行）。 */
const mineSubTab = ref<ShopItemTypeValue>('title')
const titleGroup = computed(() => mine.value.find((g) => g.type === 'title'))
const colorGroup = computed(() => mine.value.find((g) => g.type === 'username_color'))
const mineActiveGroup = computed(() => (mineSubTab.value === 'title' ? titleGroup.value : colorGroup.value))
const mineSubTabs = computed(() => [
  { label: '专属称号', value: 'title' as ShopItemTypeValue, count: titleGroup.value?.items.length ?? 0, icon: 'medal' },
  { label: '用户名颜色', value: 'username_color' as ShopItemTypeValue, count: colorGroup.value?.items.length ?? 0, icon: 'palette' },
])
const mineSubLabel = computed(() => ShopItemTypeLabel[mineSubTab.value])
function switchMineSubTab(v: ShopItemTypeValue) {
  if (mineSubTab.value === v) return
  mineSubTab.value = v
}

// ── 购买 ──
const buyModalOpen = ref(false)
const buyItem = ref<ShopItem | null>(null)

// ── 手机端分类侧边栏 ──
const drawerOpen = ref(false)

// 当前选中的分类信息（用于手机端指示器）
const currentSubTab = computed(() => subTabs.value.find(t => t.value === subTab.value) || subTabs.value[0]!)

function openBuy(item: ShopItem) {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  buyItem.value = item
  buyModalOpen.value = true
}

/** 购买成功：刷新「我的」（若在 mine tab）+ 余额已在 composable 内同步 */
function onBought() {
  if (activeTab.value === 'mine') fetchMine()
}

/** 「我的」tab 续费：直接购买同商品 */
async function renewItem(item: MyDecorationItem) {
  try {
    await purchase(item.itemId)
    toast.add({ title: '续费成功', color: 'success' })
    fetchMine()
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '续费失败'), color: 'error' })
  }
}

/** 「我的」tab 切换佩戴：把佩戴槽切到已持有的另一件（多持有模型） */
async function switchItem(item: MyDecorationItem) {
  try {
    await activate(item)
    toast.add({ title: '已切换', color: 'success' })
    fetchMine()
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '切换失败'), color: 'error' })
  }
}

// SSR 安全：列表公开可 SSR，但 authUser SSR 恒 null（余额/小黄点依赖登录），统一客户端拉取
onMounted(() => {
  fetchItems()
  if (activeTab.value === 'mine' && isLoggedIn.value) fetchMine()
})

watch(isLoggedIn, (v) => {
  if (v && activeTab.value === 'mine') fetchMine()
})

// 切到「我的」tab 时拉取持有记录（此前只在挂载/登录态变化时拉，点击 tab 不触发 → 空列表）
watch(activeTab, (tab) => {
  if (tab === 'mine' && isLoggedIn.value) fetchMine()
})
</script>
