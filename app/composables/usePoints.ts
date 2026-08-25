import { useAuth } from './useAuth'

/**
 * 全局余额同步（消费体系三通道对外只暴露 balance，见设计文档 [3.1]）。
 *
 * 铁律：任何接口若返回 `balance`，调用成功后立即 `setBalance`（`authUser.points = balance`）；
 * 否则（非操作者本人的余额变动，如采纳/退款落在他人账上）回退 `restoreSession()`。
 * 各消费/收入 composable 调用成功后自行按此二分支处理，页面不再手动赋值。
 */
export function usePoints() {
  const { user } = useAuth()

  /** 当前余额（未登录视为 0，顶栏 chip / 弹窗余额展示统一用它） */
  const balance = computed(() => user.value?.points ?? 0)

  /** 铁律第 1 分支：接口返回 balance 时直接赋值 */
  function setBalance(n: number) {
    if (user.value) user.value.points = n
  }

  return { balance, setBalance }
}
