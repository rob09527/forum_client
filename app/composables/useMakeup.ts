import type { ApiResponse } from '~/types'
import { useApiBase } from './api'
import { usePoints } from './usePoints'
import { useGameConfig } from './useGameConfig'

/**
 * 补签道具（设计文档 1.4.2 / 3.6、3.7）：`POST /api/checkin/makeup`。
 * - 入口：签到月历昨天格未签时「补签 N🍗」按钮，一步完成；
 * - 成功后返回新余额 → 按铁律 [3.1] 直接赋值，日历随之刷新。
 * 错误码：MAKEUP_UNAVAILABLE（条件不满足）/ MAKEUP_LIMIT_EXCEEDED（当月次数上限）。
 */
export function useMakeup() {
  const apiBase = useApiBase()
  const { setBalance } = usePoints()
  const { propsConfig } = useGameConfig()

  /** 补签单价（鸡腿），未加载配置时兜底 */
  const makeupPrice = computed(() => propsConfig.value.makeupPrice)

  /** 执行补签（昨天格未签才可补） */
  async function makeup(): Promise<number> {
    const res = await $fetch<ApiResponse<{ balance: number }>>(`${apiBase.value}/api/checkin/makeup`, {
      method: 'POST',
    })
    setBalance(res.data.balance)
    return res.data.balance
  }

  return { makeup, makeupPrice }
}
