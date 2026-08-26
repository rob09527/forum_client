import { computed } from 'vue'
import type {
  ApiResponse,
  BountyConfig,
  CheckinConfig,
  GameConfig,
  PropsConfig,
  ShopConfig,
  TipConfig,
} from '~/types'
import { UserLevelLabel } from '~/types'
import { useApiBase } from './api'

/**
 * 游戏化配置（签到奖励 / 等级体系 / 消费体系四组：商城·打赏·悬赏·道具）。
 * 来源：后端 GET /api/config/game —— 后台经共享 Redis 控制，未配置时后端返回默认值。
 *
 * 模块级单例缓存：多组件/并发只拉一次；请求失败用前端兜底值，不阻塞页面渲染。
 * 等级名/徽章在配置加载前回退 UserLevelLabel 静态映射与默认配色，加载后以配置为准。
 */

/** 前端兜底签到配置：与后端默认值保持一致（后端 Redis 缺失时也返回这些值） */
const FALLBACK_CHECKIN: CheckinConfig = {
  base: 5,
  streakBonusPerDay: 1,
  streakBonusCap: 5,
  milestoneEvery: 7,
  milestoneBonus: 30,
}

/** 前端兜底消费配置：与后端 DEFAULT_*_CONFIG 保持一致（后端未配置/加载失败时兜底） */
const FALLBACK_SHOP: ShopConfig = { defaultDurationDays: 30, remindDays: 3 }
const FALLBACK_TIP: TipConfig = { amounts: [6, 66, 188], customMin: 1, customMax: 1000 }
const FALLBACK_BOUNTY: BountyConfig = {
  feeRate: 0.1,
  timeoutDays: 7,
  amountMin: 50,
  amountMax: 10000,
  minTotalEarned: 0,
  minRegisterDays: 0,
  maxActivePerUser: 5,
}
const FALLBACK_PROPS: PropsConfig = {
  makeupPrice: 80,
  makeupMonthlyLimit: 3,
  renamePrice: 200,
  renameCooldownDays: 30,
  quotaPerPurchase: 10 * 1024 * 1024,
  quotaPrice: 150,
  quotaTotalLimit: 500 * 1024 * 1024,
}

/** 已知三档等级徽章配色（保持原视觉） */
const KNOWN_BADGE: Record<string, string> = {
  claw: 'bg-zinc-200 text-zinc-600',
  leg: 'bg-amber-500/20 text-amber-600',
  meat: 'bg-red-500/20 text-red-600',
}

/** 动态等级徽章调色板：按升序排名从最低（灰）到最高（红/紫） */
const DYNAMIC_BADGE_PALETTE = [
  'bg-zinc-200 text-zinc-600',
  'bg-sky-500/20 text-sky-600',
  'bg-emerald-500/20 text-emerald-600',
  'bg-amber-500/20 text-amber-600',
  'bg-red-500/20 text-red-600',
  'bg-violet-500/20 text-violet-600',
]

export function useGameConfig() {
  const apiBase = useApiBase()

  /**
   * SSR 安全：用 useAsyncData 拉配置。Nuxt 在 SSR 阶段确定性等待该请求并写入 payload，
   * 客户端从 payload 恢复（非 fire-and-forget）。若用 fire-and-forget 的 load()，
   * SSR 可能没等到配置就用静态兜底（如「鸡腿」）、客户端却快速拉到配置（「鸭腿」），
   * 触发 hydration 文本不一致导致整页报 500。
   */
  const { data: config } = useAsyncData<GameConfig | null>(
    'game-config',
    async () => {
      try {
        const res = await $fetch<ApiResponse<GameConfig>>(`${apiBase.value}/api/config/game`)
        return res.data
      } catch {
        // 请求失败返回 null → 走前端兜底；useAsyncData 缓存 null，不反复重试
        return null
      }
    },
    { default: () => null }
  )

  /** 签到奖励配置（未加载/失败时用前端兜底默认值） */
  const checkinConfig = computed<CheckinConfig>(() => config.value?.checkin ?? FALLBACK_CHECKIN)

  /** 商城配置（装饰默认时效/到期提醒提前天数） */
  const shopConfig = computed<ShopConfig>(() => config.value?.shop ?? FALLBACK_SHOP)

  /** 打赏配置（快捷档位/自定义区间） */
  const tipConfig = computed<TipConfig>(() => config.value?.tip ?? FALLBACK_TIP)

  /** 悬赏配置（手续费率/超时天数/门槛） */
  const bountyConfig = computed<BountyConfig>(() => config.value?.bounty ?? FALLBACK_BOUNTY)

  /** 道具配置（补签/改名/扩容价格与限制） */
  const propsConfig = computed<PropsConfig>(() => config.value?.props ?? FALLBACK_PROPS)

  /** 等级列表（未加载/失败时为空，等级名回退静态映射） */
  const levels = computed(() => config.value?.levels ?? [])

  /** 等级 key → 中文名：配置优先；未加载/未命中回退静态映射；再回退原 key */
  function levelName(level: string | null | undefined): string {
    const key = level ?? ''
    const found = config.value?.levels.find((l) => l.key === key)
    if (found) return found.name
    return UserLevelLabel[key] ?? key
  }

  /** 等级徽章配色：已知三档用原色，其余按配置升序排名取调色板 */
  function levelBadgeClass(level: string | null | undefined): string {
    const key = level ?? ''
    if (KNOWN_BADGE[key]) return KNOWN_BADGE[key]
    if (config.value?.levels) {
      const ascending = [...config.value.levels].reverse() // 最低 → 最高
      const idx = ascending.findIndex((l) => l.key === key)
      if (idx >= 0) return DYNAMIC_BADGE_PALETTE[Math.min(idx, DYNAMIC_BADGE_PALETTE.length - 1)] ?? 'bg-zinc-200 text-zinc-600'
    }
    return 'bg-zinc-200 text-zinc-600'
  }

  return {
    checkinConfig,
    shopConfig,
    tipConfig,
    bountyConfig,
    propsConfig,
    levels,
    levelName,
    levelBadgeClass,
  }
}
