import type { ApiResponse } from '~/types'
import { useApiBase } from './api'
import { usePoints } from './usePoints'
import { useAuth } from './useAuth'
import { useGameConfig } from './useGameConfig'

/**
 * 改名道具（设计文档 1.4.3 / 3.6、3.7）：`POST /api/me/rename`。
 * - 入口：个人主页 isOwnProfile 处「修改用户名」；
 * - 成功后同步 authUser.username + 返回新余额 → 按铁律 [3.1] 直接赋值。
 * 错误码：RENAME_COOLDOWN（30 天冷却）/ USERNAME_TAKEN（唯一性）。
 */
export function useRename() {
  const apiBase = useApiBase()
  const { setBalance } = usePoints()
  const { updateUser } = useAuth()
  const { propsConfig } = useGameConfig()

  /** 改名单价（鸡腿），未加载配置时兜底 */
  const renamePrice = computed(() => propsConfig.value.renamePrice)

  /** 执行改名（后端校验冷却/唯一性） */
  async function rename(username: string): Promise<number> {
    const res = await $fetch<ApiResponse<{ balance: number }>>(`${apiBase.value}/api/me/rename`, {
      method: 'POST',
      body: { username },
    })
    // 全站用户名随 authUser 即时更新（顶栏/右栏/UsernameText 均为响应式）
    updateUser({ username })
    setBalance(res.data.balance)
    return res.data.balance
  }

  /**
   * 实时唯一性检查（改名弹窗 [3.6]）：GET /api/users/username-available。
   * 后端排除当前用户自己；检查失败抛异常，调用方自行降级（提交时后端复检）。
   */
  async function checkAvailable(username: string): Promise<boolean> {
    const res = await $fetch<ApiResponse<{ available: boolean }>>(
      `${apiBase.value}/api/users/username-available`,
      { query: { username } }
    )
    return res.data.available
  }

  return { rename, renamePrice, checkAvailable }
}
