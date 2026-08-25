import type { ApiResponse, PostTipsResult } from '~/types'
import { useApiBase } from './api'
import { usePoints } from './usePoints'
import { useGameConfig } from './useGameConfig'

/** 打赏目标类型：帖子或评论 */
export type TipTargetType = 'post' | 'comment'

/**
 * 打赏（设计文档 3.4、3.7）：快捷档位 / 执行打赏 / 打赏者列表。
 * - `POST /api/tips` 成功后返回自己扣款后余额 → 按铁律 [3.1] 直接赋值（自己是支出方）；
 * - 档位与自定义区间来自 `GET /api/config/game → tip`（useGameConfig 兜底 [6,66,188]）。
 */
export function useTip() {
  const apiBase = useApiBase()
  const { setBalance } = usePoints()
  const { tipConfig } = useGameConfig()

  /** 快捷档位金额（如 [6,66,188]），未加载配置时兜底 */
  const tipAmounts = computed(() => tipConfig.value.amounts)

  /** 自定义打赏下限 / 上限（校验用） */
  const tipMin = computed(() => tipConfig.value.customMin)
  const tipMax = computed(() => tipConfig.value.customMax)

  /**
   * 执行打赏。
   * @returns 打赏者扣款后余额
   * @throws 后端错误码：INSUFFICIENT_POINTS / ALREADY_TIPPED / CANNOT_TIP_SELF / TIP_AMOUNT_INVALID
   */
  async function tip(input: {
    targetType: TipTargetType
    targetId: number
    amount: number
    message?: string
  }): Promise<number> {
    const res = await $fetch<ApiResponse<{ balance: number }>>(`${apiBase.value}/api/tips`, {
      method: 'POST',
      body: input,
    })
    setBalance(res.data.balance)
    return res.data.balance
  }

  /** 帖子打赏者列表（谁赏了多少、留言） */
  async function fetchPostTips(postId: number): Promise<PostTipsResult> {
    const res = await $fetch<ApiResponse<PostTipsResult>>(`${apiBase.value}/api/posts/${postId}/tips`)
    return res.data
  }

  /** 评论打赏者列表 */
  async function fetchCommentTips(commentId: number): Promise<PostTipsResult> {
    const res = await $fetch<ApiResponse<PostTipsResult>>(
      `${apiBase.value}/api/comments/${commentId}/tips`
    )
    return res.data
  }

  return { tipAmounts, tipMin, tipMax, tip, fetchPostTips, fetchCommentTips }
}
