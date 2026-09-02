import type { User, LoginInput, RegisterInput, TelegramAuthInput, AuthResult, ApiResponse } from '~/types'
import { useApiBase, extractErrorMessage } from './api'

export function useAuth() {
  const apiBase = useApiBase()

  /** 全局 auth 用户状态，跨组件共享（useState 按 key 共享） */
  const authUser = useState<User | null>('auth-user', () => null)
  const showAuthModal = useState<boolean>('auth-modal', () => false)
  const authModalTab = useState<'login' | 'register'>('auth-modal-tab', () => 'login')

  const isLoggedIn = computed(() => authUser.value !== null)
  const isLoading = ref(false)
  // 初始 session 恢复中。用 useState 共享：default.vue 的 restoreSession 完成后，
  // 所有 useAuth() 实例（edit.vue / new.vue 等）都能感知恢复结束，不会各自卡在恢复态
  const isRestoring = useState<boolean>('auth-restoring', () => true)

  /**
   * 恢复登录状态——应用启动时调用一次。
   * 通过 httpOnly cookie 验证，无需传 token。
   */
  async function restoreSession(): Promise<void> {
    try {
      const res = await $fetch<{ success: boolean; data: { user: User } }>(
        `${apiBase.value}/api/auth/me`
      )
      if (res.success && res.data.user) {
        authUser.value = res.data.user
      }
    } catch {
      // cookie 不存在或已过期，静默处理
    } finally {
      isRestoring.value = false
    }
  }

  /** 邮箱登录 */
  async function login(input: LoginInput): Promise<string | null> {
    isLoading.value = true
    try {
      const res = await $fetch<ApiResponse<AuthResult>>(
        `${apiBase.value}/api/auth/login`,
        { method: 'POST', body: input }
      )
      if (res.success) {
        authUser.value = res.data.user
        showAuthModal.value = false
        return null // 成功，无错误
      }
      return '登录失败，请重试'
    } catch (err: any) {
      return extractErrorMessage(err)
    } finally {
      isLoading.value = false
    }
  }

  /** 邮箱注册 */
  async function register(input: RegisterInput): Promise<string | null> {
    isLoading.value = true
    try {
      const res = await $fetch<ApiResponse<AuthResult>>(
        `${apiBase.value}/api/auth/register`,
        { method: 'POST', body: input }
      )
      if (res.success) {
        authUser.value = res.data.user
        showAuthModal.value = false
        return null
      }
      return '注册失败，请重试'
    } catch (err: any) {
      return extractErrorMessage(err)
    } finally {
      isLoading.value = false
    }
  }

  /** Telegram 登录/注册（合一），验签在后端完成 */
  async function telegramLogin(data: TelegramAuthInput): Promise<{ error: string | null; isNewUser?: boolean }> {
    isLoading.value = true
    try {
      const res = await $fetch<ApiResponse<AuthResult>>(
        `${apiBase.value}/api/auth/telegram`,
        { method: 'POST', body: data }
      )
      if (res.success) {
        authUser.value = res.data.user
        showAuthModal.value = false
        return { error: null, isNewUser: res.data.isNewUser }
      }
      return { error: '登录失败，请重试' }
    } catch (err: any) {
      return { error: extractErrorMessage(err) }
    } finally {
      isLoading.value = false
    }
  }

  /** 退出登录 */
  async function logout(): Promise<void> {
    try {
      await $fetch(`${apiBase.value}/api/auth/logout`, { method: 'POST' })
    } catch {
      // 即使服务端退出失败，也清除本地状态
    }
    authUser.value = null
    // 刻意不销毁 Telegram widget：widget 记住的是 Telegram 侧(oauth.telegram.org)的会话，
    // 与本站登录态无关。退出后重开弹窗，用户仍可一键以同一 TG 账号登录；
    // 换账号在 AuthModal 内通过重载 iframe 引导完成。
  }

  /** 打开登录弹窗 */
  function openLogin() {
    authModalTab.value = 'login'
    showAuthModal.value = true
  }

  /** 打开注册弹窗 */
  function openRegister() {
    authModalTab.value = 'register'
    showAuthModal.value = true
  }

  /** 关闭弹窗 */
  function closeModal() {
    showAuthModal.value = false
  }

  /** 更新当前用户状态（用于资料/头像更新后即时同步） */
  function updateUser(patch: Partial<User>) {
    if (authUser.value) {
      authUser.value = { ...authUser.value, ...patch }
    }
  }

  // ── Telegram "切换账号"的登出返回标记 ──
  // Telegram oauth widget 无页内选号能力（见 AuthModal 注释）。切换账号的实现 =
  // 整页跳 oauth.telegram.org/auth/logout 登出本站授权 → Telegram 重定向回本站。
  // 离开页面前写标记，回来时 default.vue 检测到就自动重开登录弹窗。key 只在 useAuth 出现一次。
  const TG_LOGOUT_PENDING_KEY = 'forum-tg-logout-pending'

  /** 切换账号前调用：记录"正在跳 Telegram 登出"，返回后重开弹窗 */
  function markTgAccountLogoutPending() {
    if (import.meta.client) sessionStorage.setItem(TG_LOGOUT_PENDING_KEY, '1')
  }

  /** 应用启动/回到本站时调用：若带登出返回标记，自动重开登录弹窗并清标记 */
  function resumeAfterTgLogout() {
    if (import.meta.client && sessionStorage.getItem(TG_LOGOUT_PENDING_KEY)) {
      sessionStorage.removeItem(TG_LOGOUT_PENDING_KEY)
      authModalTab.value = 'login'
      showAuthModal.value = true
    }
  }

  return {
    user: authUser,
    isLoggedIn,
    isLoading,
    isRestoring,
    showAuthModal,
    authModalTab,
    login,
    register,
    telegramLogin,
    logout,
    restoreSession,
    openLogin,
    openRegister,
    closeModal,
    updateUser,
    markTgAccountLogoutPending,
    resumeAfterTgLogout,
  }
}
