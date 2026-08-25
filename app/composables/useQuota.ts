import type { ApiResponse } from '~/types'
import { useApiBase } from './api'
import { usePoints } from './usePoints'
import { useGameConfig } from './useGameConfig'

/**
 * 上传扩容道具（设计文档 1.4.4 / 3.6、3.7）：`POST /api/me/quota`。
 * - 入口：编辑器上传触发 `UPLOAD_USER_TOTAL_EXCEEDED` 时弹「扩容 +NMB 需 M🍗」引导；
 * - 成功后返回新余额 → 按铁律 [3.1] 直接赋值；容量在后端 uploadQuotaBonus 累积（永久额度）。
 * 错误码：QUOTA_LIMIT_EXCEEDED（总额封顶 500MB）。
 */
export function useQuota() {
  const apiBase = useApiBase()
  const { setBalance } = usePoints()
  const { propsConfig } = useGameConfig()

  /** 扩容单价（鸡腿），未加载配置时兜底 */
  const quotaPrice = computed(() => propsConfig.value.quotaPrice)

  /** 单次扩容容量（MB，配置单位为字节） */
  const quotaPerPurchaseMB = computed(() =>
    Math.round(propsConfig.value.quotaPerPurchase / 1024 / 1024)
  )

  /** 扩容总额封顶（MB） */
  const quotaTotalLimitMB = computed(() => Math.round(propsConfig.value.quotaTotalLimit / 1024 / 1024))

  /** 执行扩容（返回新余额） */
  async function buy(): Promise<number> {
    const res = await $fetch<ApiResponse<{ balance: number }>>(`${apiBase.value}/api/me/quota`, {
      method: 'POST',
    })
    setBalance(res.data.balance)
    return res.data.balance
  }

  return { buy, quotaPrice, quotaPerPurchaseMB, quotaTotalLimitMB }
}
