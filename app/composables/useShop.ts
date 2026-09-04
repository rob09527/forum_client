import type { ApiResponse, MyDecorationGroup, MyDecorationItem, ShopExpiringItem, ShopItem, User } from '~/types'
import { useApiBase, extractErrorMessage } from './api'
import { usePoints } from './usePoints'
import { useAuth } from './useAuth'

/**
 * 装饰商城：列表 / 我的装饰 / 购买（设计文档 3.2、3.7）。
 * - `GET /api/shop/items`（optionalAuth）返回 `{ items, balance, expiringSoon }`；
 * - `GET /api/shop/mine`（登录）返回按 type 分组的持有记录（含过期，置灰+续费）；
 * - `POST /api/shop/items/:id/purchase` 购买/续费/换购同接口，成功后按铁律 [3.1] 同步余额。
 *
 * expiringSoon 走全局 `useState('shop-expiring')`，供顶栏 chip 挂小黄点 [1.3.4]；
 * 进站时（layout onMounted）与 restoreSession() 并行拉一次。
 * 列表是公开数据，但为与全站一致仍在客户端 onMounted 拉取（SSR 恒为 null 的 authUser 不参与）。
 */
interface ShopListResult {
  items: ShopItem[]
  /** 当前余额；未登录为 null */
  balance: number | null
  expiringSoon: ShopExpiringItem[]
}

export function useShop() {
  const apiBase = useApiBase()
  const { setBalance } = usePoints()
  const { updateUser } = useAuth()

  /** 商品列表 */
  const items = ref<ShopItem[]>([])
  /** 本接口返回的余额（未登录 null），商城页头部展示用 */
  const balance = ref<number | null>(null)
  /** 临近到期装饰（页面横幅用） */
  const expiringSoon = ref<ShopExpiringItem[]>([])
  /** 我的装饰（按 type 分组，含过期项） */
  const mine = ref<MyDecorationGroup[]>([])
  const isLoading = ref(false)
  const isMineLoading = ref(false)
  const error = ref<string | null>(null)

  /** 顶栏小黄点全局态：跨页面共享，AppHeader 据此挂提醒样式 */
  const expiringState = useState<ShopExpiringItem[]>('shop-expiring', () => [])

  /** 拉取商城列表（optionalAuth，未登录也返回商品，expiringSoon 为空数组） */
  async function fetchItems(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<ApiResponse<ShopListResult>>(`${apiBase.value}/api/shop/items`)
      items.value = res.data.items
      balance.value = res.data.balance
      expiringSoon.value = res.data.expiringSoon
      expiringState.value = res.data.expiringSoon
      // 铁律 [3.1]：接口返回 balance（登录态）→ 直接赋值
      if (typeof res.data.balance === 'number') setBalance(res.data.balance)
    } catch (err: any) {
      error.value = extractErrorMessage(err)
    } finally {
      isLoading.value = false
    }
  }

  /** 拉取我的装饰（需登录；未登录时页面引导登录） */
  async function fetchMine(): Promise<void> {
    isMineLoading.value = true
    try {
      const res = await $fetch<ApiResponse<MyDecorationGroup[]>>(`${apiBase.value}/api/shop/mine`)
      mine.value = res.data
    } catch (err: any) {
      error.value = extractErrorMessage(err)
    } finally {
      isMineLoading.value = false
    }
  }

  /**
   * 购买/续费/换购。成功后已按铁律同步余额；调用方负责 toast + 刷新「我的」。
   * 同时把装饰生效槽写入 authUser：配合 UsernameText 对「我」覆盖，全站立即变色 [3.9]。
   * @param item 待购商品（用于同步装饰槽；不传则仅同步余额，如续费入口复用）
   * @returns { balance, expireAt } 扣款后余额与本次到期时间
   */
  async function purchase(id: number, item?: ShopItem): Promise<{ balance: number; expireAt: string }> {
    const res = await $fetch<ApiResponse<{ balance: number; expireAt: string }>>(
      `${apiBase.value}/api/shop/items/${id}/purchase`,
      { method: 'POST' }
    )
    setBalance(res.data.balance)
    if (item) {
      // 单槽覆盖：颜色/称号各一个生效槽，与后端 buyDecoration 的 colorFields 语义一致。
      // 头像已于 §9.2 下线商品化，此处不再有 avatar 分支。
      const patch: Partial<User> = item.type === 'username_color'
        ? { decorColorValue: item.renderValue, decorColorExpireAt: res.data.expireAt }
        : { decorTitleValue: item.renderValue, decorTitleStyle: item.renderStyle, decorTitleExpireAt: res.data.expireAt }
      updateUser(patch)
    }
    return res.data
  }

  /**
   * 切换佩戴已持有的装饰（多持有模型）。成功后把佩戴槽同步进 authUser，
   * 配合 UsernameText 对「我」覆盖，全站立即变色 [3.9]。
   * @param item 持有记录（含快照 renderValue/renderStyle/expireAt，用于本地同步佩戴槽）
   */
  async function activate(item: MyDecorationItem): Promise<void> {
    await $fetch<ApiResponse<{ expireAt: string }>>(
      `${apiBase.value}/api/shop/mine/${item.id}/activate`,
      { method: 'POST' }
    )
    // 头像已于 §9.2 下线商品化，佩戴槽只剩颜色/称号
    const patch: Partial<User> = item.type === 'username_color'
      ? { decorColorValue: item.renderValue, decorColorExpireAt: item.expireAt }
      : { decorTitleValue: item.renderValue, decorTitleStyle: item.renderStyle, decorTitleExpireAt: item.expireAt }
    updateUser(patch)
  }

  return {
    items,
    balance,
    expiringSoon,
    expiringState,
    mine,
    isLoading,
    isMineLoading,
    error,
    fetchItems,
    fetchMine,
    purchase,
    activate,
  }
}
