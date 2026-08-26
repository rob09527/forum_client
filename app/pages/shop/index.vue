<template>
  <div class="max-w-5xl mx-auto space-y-4">
    <!-- 到期提醒横幅 [1.3.4] -->
    <ShopBanner v-if="expiringSoon.length" :items="expiringSoon" />

    <!-- Tab（URL query 驱动，?tab=mine 直达「我的」；顶部不展示余额）。
         tabs 保留右侧定位（ml-auto）：原面板即「余额在左 + tabs 靠右」，去余额后 tabs 归位、左侧留白更干净 -->
    <div class="panel px-5 py-3 flex items-center gap-3">
      <div class="ml-auto flex items-center gap-1">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="px-3.5 py-1.5 text-sm rounded-md transition-colors inline-flex items-center gap-1.5"
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
      <!-- 称号 / 颜色 切换子 tab：不全部铺满，一次只展示一个分区 -->
      <template v-else>
        <div class="flex items-center gap-2 px-1">
          <button
            v-for="st in subTabs"
            :key="st.value"
            class="px-3 py-1.5 text-sm rounded-lg transition-colors inline-flex items-center gap-1"
            :class="subTab === st.value ? 'bg-blue-500 text-white' : 'text-zinc-600 hover:text-zinc-900'"
            @click="switchSubTab(st.value)"
          >
            <AppIcon :name="st.icon" :size="14" /> {{ st.label }}（{{ st.count }}）
          </button>
        </div>

        <!-- 头像风格切换：一次只看一个风格的 20 个，避免 400 个头像全铺开 -->
        <div v-if="subTab === 'avatar'" class="flex flex-wrap gap-2 px-1 mt-3">
          <button
            v-for="s in avatarStyleDefs"
            :key="s.id"
            class="style-pill"
            :class="{ on: effectiveAvatarStyle === s.id }"
            @click="switchAvatarStyle(s.id)"
          >
            <AppIcon :name="s.icon" :size="14" class="shrink-0" /> {{ s.label }}
          </button>
        </div>

        <!-- 每页 6 条（3 列 × 2 行） -->
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
        <!-- 我的 称号/颜色切换（同商城分区，不做下拉铺满） -->
        <div class="flex items-center gap-2 px-1">
          <button
            v-for="mt in mineSubTabs"
            :key="mt.value"
            class="px-3 py-1.5 text-sm rounded-lg transition-colors inline-flex items-center gap-1"
            :class="mineSubTab === mt.value ? 'bg-blue-500 text-white' : 'text-zinc-600 hover:text-zinc-900'"
            @click="switchMineSubTab(mt.value)"
          >
            <AppIcon :name="mt.icon" :size="14" /> {{ mt.label }}（{{ mt.count }}）
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
  </div>
</template>

<script setup lang="ts">
import type { MyDecorationItem, ShopItem, ShopItemTypeValue } from '~/types'
import { ShopItemTypeLabel } from '~/types'
import { useShop } from '~/composables/useShop'
import { useAuth } from '~/composables/useAuth'
import { useAvatarStyles } from '~/composables/useAvatarStyles'
import { deriveStyleDefs } from '~/utils/avatar'
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

/** 称号区 / 颜色区 / 头像区拆分 [2.2]：业务分区展示，互不冗杂。
 * 商城只卖付费头像（免费池头像在个人资料选择器直接选、不在商城展示），按风格 pill 切换，一次看一个风格。 */
const titleItems = computed(() => items.value.filter((i) => i.type === 'title'))
const colorItems = computed(() => items.value.filter((i) => i.type === 'username_color'))
const avatarItems = computed(() => items.value.filter((i) => i.type === 'avatar' && i.price > 0))

/** 头像风格 pill（中文名 + 图标）：复用后端下发的权威风格清单 + 前端中英文案映射。
 * 免费池风格在商城无商品，从 pill 列表剔除（不在商城展示）。 */
const { data: avatarStyles } = useAvatarStyles()
const avatarStyleDefs = computed(() =>
  deriveStyleDefs(avatarStyles.value?.styles ?? []).filter((d) =>
    avatarItems.value.some((i) => i.renderValue.startsWith(`/avatars/${d.id}/`)),
  ),
)
/** 当前选中的头像风格；未显式选择时兜底到第一个（支持 ?sub=avatar 直达） */
const activeAvatarStyle = ref<string>('')
const effectiveAvatarStyle = computed(() => activeAvatarStyle.value || avatarStyleDefs.value[0]?.id || '')
/** 选中风格下的头像列表 */
const avatarStyleList = computed(() => {
  if (!effectiveAvatarStyle.value) return []
  return avatarItems.value.filter((i) => i.renderValue.startsWith(`/avatars/${effectiveAvatarStyle.value}/`))
})
function switchAvatarStyle(style: string) {
  if (activeAvatarStyle.value === style) return
  activeAvatarStyle.value = style
  page.value = 0
}

/** 称号 / 颜色 / 头像 子 tab + 分页（每页 6 条 = 3 列 × 2 行）。
 * ?sub=avatar 直达头像分区（AvatarPicker 付费头像跳转用）。 */
const PAGE_SIZE = 6
const subTab = ref<ShopItemTypeValue>((route.query.sub as ShopItemTypeValue) === 'avatar' ? 'avatar' : 'title')
const page = ref(0)
const subTabs = computed(() => [
  { label: '专属称号', value: 'title' as ShopItemTypeValue, count: titleItems.value.length, icon: 'medal' },
  { label: '用户名颜色', value: 'username_color' as ShopItemTypeValue, count: colorItems.value.length, icon: 'palette' },
  { label: '头像', value: 'avatar' as ShopItemTypeValue, count: avatarItems.value.length, icon: 'user' },
])
const currentList = computed(() =>
  subTab.value === 'title' ? titleItems.value
    : subTab.value === 'avatar' ? avatarStyleList.value
    : colorItems.value)
const totalPages = computed(() => Math.max(1, Math.ceil(currentList.value.length / PAGE_SIZE)))
const pagedItems = computed(() => {
  const p = Math.min(page.value, totalPages.value - 1)
  return currentList.value.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE)
})
function switchSubTab(v: ShopItemTypeValue) {
  if (subTab.value === v) return
  subTab.value = v
  page.value = 0
  // 进入头像分区时默认选中第一个风格（length 已保证 [0] 存在）
  if (v === 'avatar' && !activeAvatarStyle.value && avatarStyleDefs.value.length) {
    activeAvatarStyle.value = avatarStyleDefs.value[0]!.id
  }
}
function prevPage() {
  if (page.value > 0) page.value--
}
function nextPage() {
  if (page.value < totalPages.value - 1) page.value++
}

/** 「我的」tab：称号/颜色/头像切换（同商城分区，不做下拉铺满） */
const mineSubTab = ref<ShopItemTypeValue>('title')
const titleGroup = computed(() => mine.value.find((g) => g.type === 'title'))
const colorGroup = computed(() => mine.value.find((g) => g.type === 'username_color'))
const avatarGroup = computed(() => mine.value.find((g) => g.type === 'avatar'))
const mineActiveGroup = computed(() =>
  mineSubTab.value === 'title' ? titleGroup.value
    : mineSubTab.value === 'avatar' ? avatarGroup.value
    : colorGroup.value)
const mineSubTabs = computed(() => [
  { label: '专属称号', value: 'title' as ShopItemTypeValue, count: titleGroup.value?.items.length ?? 0, icon: 'medal' },
  { label: '用户名颜色', value: 'username_color' as ShopItemTypeValue, count: colorGroup.value?.items.length ?? 0, icon: 'palette' },
  { label: '头像', value: 'avatar' as ShopItemTypeValue, count: avatarGroup.value?.items.length ?? 0, icon: 'user' },
])
const mineSubLabel = computed(() => ShopItemTypeLabel[mineSubTab.value])
function switchMineSubTab(v: ShopItemTypeValue) {
  if (mineSubTab.value === v) return
  mineSubTab.value = v
}

// ── 购买 ──
const buyModalOpen = ref(false)
const buyItem = ref<ShopItem | null>(null)

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

<style scoped>
/* 头像风格切换 pill（与后台商品目录同款）。
   颜色直接取项目主题 blue/zinc 色值（main.css --color-primary=#3b82f6），
   不依赖 Nuxt UI 的 --ui-color-* 变量——该项目未注入这些变量，
   background 失效会回退白底 + color:#fff → 选中态白底白字不可见（bug 修复）。 */
.style-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 16px;
  border: 1px solid #e4e4e7; /* zinc-200 */
  background: #fff;
  font-size: 12px;
  color: #52525b; /* zinc-600 */
  cursor: pointer;
  transition: all 0.15s;
}
.style-pill:hover {
  border-color: #3b82f6; /* blue-500 */
  color: #3b82f6;
}
.style-pill.on {
  background: #3b82f6; /* blue-500 */
  border-color: #3b82f6;
  color: #fff;
  font-weight: 600;
}
</style>
