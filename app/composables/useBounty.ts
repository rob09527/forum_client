import type { ApiResponse, BountyAcceptResult } from '~/types'
import { useApiBase } from './api'
import { usePoints } from './usePoints'
import { useAuth } from './useAuth'

/**
 * 悬赏（设计文档 3.5、3.7）：采纳回答 / 取消悬赏。
 * - `POST /api/bounties/:id/accept`（仅发起人）返回 `{ payout }`，无 balance。
 *   采纳时 BOUNTY_IN 落在回答者账上，非本人余额变动 → 按铁律 [3.1] 回退 restoreSession()；
 * - `POST /api/bounties/:id/cancel`（仅发起人）托管金退回发起人余额 → 返回 balance 直接赋值。
 */
export function useBounty() {
  const apiBase = useApiBase()
  const { setBalance } = usePoints()
  const { restoreSession } = useAuth()

  /**
   * 采纳回答（发起人视角，不可逆）。
   * @returns 实发金额（托管金额 − 手续费）
   */
  async function accept(id: number, commentId: number): Promise<BountyAcceptResult> {
    const res = await $fetch<ApiResponse<BountyAcceptResult>>(`${apiBase.value}/api/bounties/${id}/accept`, {
      method: 'POST',
      body: { commentId },
    })
    // 铁律 [3.1]：本接口不返回 balance（奖励落在回答者账上）→ restoreSession() 兜底
    await restoreSession()
    return res.data
  }

  /** 取消悬赏（仅发起人；托管金退回自己余额） */
  async function cancel(id: number): Promise<number> {
    const res = await $fetch<ApiResponse<{ balance: number }>>(
      `${apiBase.value}/api/bounties/${id}/cancel`,
      { method: 'POST' }
    )
    setBalance(res.data.balance)
    return res.data.balance
  }

  return { accept, cancel }
}
