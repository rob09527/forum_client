<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showAuthModal"
        class="fixed inset-0 z-[100] flex items-center justify-center"
        @click.self="closeModal"
        @keydown.escape="closeModal"
      >
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- 弹窗主体（极淡装饰底铺氛围，白色遮罩控透明度，视觉AI出图 §5 #6） -->
        <div
          class="relative bg-white border border-zinc-200 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden auth-decor"
        >
          <!-- 关闭按钮（整改：max-w-md + mx-4 在 390px 屏几乎占满宽度，点遮罩边缘很难触发 @click.self，必须有显式关闭渠道） -->
          <button
            type="button"
            class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-zinc-500 hover:text-zinc-800 flex items-center justify-center shadow-sm transition-colors"
            aria-label="关闭登录"
            @click="closeModal"
          >
            <AppIcon name="x" :size="16" />
          </button>

          <!-- Logo -->
          <div class="text-center pt-8 pb-2">
            <span class="text-2xl font-bold text-blue-600 tracking-tight">AI Base</span>
            <p class="text-xs text-zinc-500 mt-1">AI 开发者的中文社区</p>
          </div>

          <!-- Tab 切换 -->
          <div class="flex px-6 mt-4">
            <button
              :class="[
                'flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors',
                tab === 'login'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-600'
              ]"
              @click="switchTab('login')"
            >
              登录
            </button>
            <button
              :class="[
                'flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors',
                tab === 'register'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-600'
              ]"
              @click="switchTab('register')"
            >
              注册
            </button>
          </div>

          <!-- 表单区 -->
          <div class="px-6 py-5 space-y-4">
            <!-- ====== 登录表单 ====== -->
            <template v-if="tab === 'login'">
              <div class="space-y-3">
                <div>
                  <label class="block text-xs text-zinc-500 mb-1.5 ml-0.5">邮箱</label>
                  <input
                    ref="loginEmailRef"
                    v-model="loginForm.email"
                    type="email"
                    autocomplete="email"
                    placeholder="your@email.com"
                    class="w-full h-10 px-3.5 text-sm bg-white border rounded-lg text-zinc-800 placeholder-zinc-600
                           focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    :class="loginErrors.email ? 'border-red-500/50' : 'border-zinc-200'"
                    @blur="validateLoginEmail"
                    @input="loginErrors.email = ''"
                    @keydown.enter="handleLogin"
                  />
                  <p v-if="loginErrors.email" class="text-xs text-red-600 mt-1 ml-0.5">{{ loginErrors.email }}</p>
                </div>
                <div>
                  <label class="block text-xs text-zinc-500 mb-1.5 ml-0.5">密码</label>
                  <div class="relative">
                    <input
                      v-model="loginForm.password"
                      :type="showLoginPwd ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="输入密码"
                      class="w-full h-10 px-3.5 pr-10 text-sm bg-white border rounded-lg text-zinc-800 placeholder-zinc-600
                             focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      :class="loginErrors.password ? 'border-red-500/50' : 'border-zinc-200'"
                      @blur="validateLoginPassword"
                      @input="loginErrors.password = ''"
                      @keydown.enter="handleLogin"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-700 transition-colors"
                      aria-label="切换密码可见"
                      @click="showLoginPwd = !showLoginPwd"
                    >
                      <AppIcon :name="showLoginPwd ? 'eye-off' : 'eye'" :size="16" />
                    </button>
                  </div>
                  <p v-if="loginErrors.password" class="text-xs text-red-600 mt-1 ml-0.5">{{ loginErrors.password }}</p>
                </div>
              </div>

              <!-- 错误信息 -->
              <div
                v-if="loginError"
                class="flex items-center gap-2 text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"
              >
                <AppIcon name="alert-triangle" :size="14" class="flex-shrink-0" />
                <span>{{ loginError }}</span>
              </div>

              <!-- 提交按钮 -->
              <button
                class="btn btn-primary w-full h-11 text-sm font-medium flex items-center justify-center gap-2"
                :disabled="isLoading"
                @click="handleLogin"
              >
                <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{{ isLoading ? '登录中...' : '登录' }}</span>
              </button>

              <p class="text-center text-xs text-zinc-500">
                还没有账号？
                <button class="text-blue-600 hover:text-blue-500 transition-colors" @click="switchTab('register')">立即注册</button>
              </p>
            </template>

            <!-- ====== 注册表单 ====== -->
            <template v-if="tab === 'register'">
              <div class="space-y-3">
                <div>
                  <label class="block text-xs text-zinc-500 mb-1.5 ml-0.5">用户名</label>
                  <input
                    ref="registerUsernameRef"
                    v-model="registerForm.username"
                    type="text"
                    autocomplete="username"
                    placeholder="3-20 个字符"
                    class="w-full h-10 px-3.5 text-sm bg-white border rounded-lg text-zinc-800 placeholder-zinc-600
                           focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    :class="registerErrors.username ? 'border-red-500/50' : 'border-zinc-200'"
                    @blur="validateRegisterUsername"
                    @input="registerErrors.username = ''"
                    @keydown.enter="handleRegister"
                  />
                  <p v-if="registerErrors.username" class="text-xs text-red-600 mt-1 ml-0.5">{{ registerErrors.username }}</p>
                </div>
                <div>
                  <label class="block text-xs text-zinc-500 mb-1.5 ml-0.5">邮箱</label>
                  <input
                    v-model="registerForm.email"
                    type="email"
                    autocomplete="email"
                    placeholder="your@email.com"
                    class="w-full h-10 px-3.5 text-sm bg-white border rounded-lg text-zinc-800 placeholder-zinc-600
                           focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    :class="registerErrors.email ? 'border-red-500/50' : 'border-zinc-200'"
                    @blur="validateRegisterEmail"
                    @input="registerErrors.email = ''"
                    @keydown.enter="handleRegister"
                  />
                  <p v-if="registerErrors.email" class="text-xs text-red-600 mt-1 ml-0.5">{{ registerErrors.email }}</p>
                </div>
                <div>
                  <label class="block text-xs text-zinc-500 mb-1.5 ml-0.5">密码</label>
                  <div class="relative">
                    <input
                      v-model="registerForm.password"
                      :type="showRegisterPwd ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="至少 8 个字符"
                      class="w-full h-10 px-3.5 pr-10 text-sm bg-white border rounded-lg text-zinc-800 placeholder-zinc-600
                             focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      :class="registerErrors.password ? 'border-red-500/50' : 'border-zinc-200'"
                      @blur="validateRegisterPassword"
                      @input="registerErrors.password = ''"
                      @keydown.enter="handleRegister"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-700 transition-colors"
                      aria-label="切换密码可见"
                      @click="showRegisterPwd = !showRegisterPwd"
                    >
                      <AppIcon :name="showRegisterPwd ? 'eye-off' : 'eye'" :size="16" />
                    </button>
                  </div>
                  <p v-if="registerErrors.password" class="text-xs text-red-600 mt-1 ml-0.5">{{ registerErrors.password }}</p>
                </div>
              </div>

              <!-- 错误信息 -->
              <div
                v-if="registerError"
                class="flex items-center gap-2 text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"
              >
                <AppIcon name="alert-triangle" :size="14" class="flex-shrink-0" />
                <span>{{ registerError }}</span>
              </div>

              <!-- 提交按钮 -->
              <button
                class="btn btn-primary w-full h-11 text-sm font-medium flex items-center justify-center gap-2"
                :disabled="isLoading"
                @click="handleRegister"
              >
                <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{{ isLoading ? '注册中...' : '注册' }}</span>
              </button>

              <p class="text-center text-xs text-zinc-500">
                已有账号？
                <button class="text-blue-600 hover:text-blue-500 transition-colors" @click="switchTab('login')">立即登录</button>
              </p>
            </template>

            <!-- Telegram 登录分隔线 -->
            <div class="flex items-center gap-3">
              <div class="flex-1 h-px bg-white" />
              <span class="text-xs text-zinc-600">或</span>
              <div class="flex-1 h-px bg-white" />
            </div>

            <!-- Telegram Login Widget：容器始终渲染，加载中转圈叠加在上层 -->
            <div class="relative w-full flex justify-center">
              <!-- 加载中遮罩：脚本加载 / 切换账号重载时显示 -->
              <div
                v-if="telegramWidgetLoading"
                class="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/60 rounded-lg"
              >
                <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span class="text-sm text-gray-500">加载 Telegram 登录...</span>
              </div>

              <!-- 连不上 Telegram 服务（断网 / 未开代理 / 被屏蔽 / 超时）：友好提示 + 重试，绝不让弹窗卡死 -->
              <div
                v-if="telegramUnavailable"
                class="w-full flex flex-col items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-4"
              >
                <AppIcon name="alert-triangle" :size="18" class="text-amber-500" />
                <p class="text-xs leading-relaxed text-amber-700 text-center">
                  {{ telegramUnavailableMsg }}
                </p>
                <button
                  type="button"
                  class="mt-1 h-8 px-4 text-xs font-medium rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors"
                  @click="retryTelegramWidget"
                >
                  重新加载
                </button>
              </div>

              <div ref="telegramContainer" class="w-full flex justify-center" />
            </div>

            <!-- 切换账号：入口文字按钮 / 展开的引导面板（二选一） -->
            <div v-if="telegramReady" class="mt-2">
              <button
                v-if="!showTgSwitchGuide"
                type="button"
                class="w-full text-center text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="telegramWidgetLoading"
                @click="handleSwitchTelegramAccount"
              >
                使用其他 Telegram 账号登录
              </button>

              <!-- 引导面板：Telegram 不允许网站代登出（实测 auth/logout 跳转不生效，见 docs/Telegram登录优化修复-2026-09-02.md §八），
                   改为指引用户在 TG 侧断开本 bot 授权后回来用新账号走完整授权 -->
              <div v-else class="text-left rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2.5">
                <p class="text-sm font-medium text-zinc-800 flex items-center gap-1.5">
                  <AppIcon name="info" :size="15" class="text-blue-500" />
                  切换 Telegram 账号
                </p>
                <p class="text-xs leading-relaxed text-zinc-600">
                  Telegram 出于安全限制不允许网站替你登出当前授权——直接点按钮只会回到旧账号的一键登录。
                  要换用其它账号，请先在 Telegram 侧断开本 bot：
                </p>
                <ol class="text-xs leading-relaxed text-zinc-600 space-y-1.5 list-decimal pl-4">
                  <li>打开 Telegram（手机 / 桌面 App）→ 设置 → 隐私与安全 → <span class="text-zinc-800">已连接网站 / 登录授权</span>。</li>
                  <li>找到本 bot <span class="text-blue-600">@{{ telegramBotUsername }}</span>，移除 / 断开连接。</li>
                  <li>回本站点下方按钮，用<strong>另一个</strong> Telegram 账号重新授权（会要求输入新账号手机号或扫码）。</li>
                </ol>
                <div class="flex gap-2 pt-1">
                  <button
                    type="button"
                    class="flex-1 h-9 text-xs font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                    @click="reloadTelegramWidget"
                  >
                    我已断开，重新加载登录
                  </button>
                  <button
                    type="button"
                    class="px-3 h-9 text-xs rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-100 transition-colors"
                    @click="showTgSwitchGuide = false"
                  >
                    返回
                  </button>
                </div>
              </div>
            </div>
            <p v-if="telegramReady && !showTgSwitchGuide" class="text-[11px] text-gray-400 text-center mt-1">
              想换账号？需先在 Telegram 侧断开本 bot，本站无法代登出
            </p>

            <!-- Telegram 错误提示（增强样式） -->
            <div v-if="telegramError" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{{ telegramError }}</p>
              <p class="text-xs text-red-500 mt-1">如果问题持续出现，请尝试刷新页面</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { TelegramAuthInput } from '~/types'

const {
  showAuthModal,
  authModalTab: tab,
  login: doLogin,
  register: doRegister,
  telegramLogin,
  isLoading,
  closeModal,
} = useAuth()

const toast = useToast()

// ── 登录表单 ──
const loginForm = reactive({ email: '', password: '' })
const loginErrors = reactive({ email: '', password: '' })
const loginError = ref('')
const showLoginPwd = ref(false)
const loginEmailRef = ref<HTMLInputElement | null>(null)

// ── 注册表单 ──
const registerForm = reactive({ username: '', email: '', password: '' })
const registerErrors = reactive({ username: '', email: '', password: '' })
const registerError = ref('')
const showRegisterPwd = ref(false)
const registerUsernameRef = ref<HTMLInputElement | null>(null)

// ── Tab 切换时自动聚焦 ──
function switchTab(t: 'login' | 'register') {
  tab.value = t
  // 清除所有错误
  loginError.value = ''
  registerError.value = ''
  Object.keys(loginErrors).forEach(k => (loginErrors[k as keyof typeof loginErrors] = ''))
  Object.keys(registerErrors).forEach(k => (registerErrors[k as keyof typeof registerErrors] = ''))
  // 聚焦第一个输入
  nextTick(() => {
    if (t === 'login') loginEmailRef.value?.focus()
    else registerUsernameRef.value?.focus()
  })
}

// ── 客户端验证 ──
function validateLoginEmail() {
  if (!loginForm.email) loginErrors.email = '请输入邮箱地址'
  else if (!loginForm.email.includes('@')) loginErrors.email = '邮箱格式不正确'
}
function validateLoginPassword() {
  if (!loginForm.password) loginErrors.password = '请输入密码'
}
function validateRegisterUsername() {
  const v = registerForm.username
  if (!v) registerErrors.username = '请输入用户名'
  else if (v.length < 3 || v.length > 20) registerErrors.username = '用户名需要 3-20 个字符'
}
function validateRegisterEmail() {
  if (!registerForm.email) registerErrors.email = '请输入邮箱地址'
  else if (!registerForm.email.includes('@')) registerErrors.email = '邮箱格式不正确'
}
function validateRegisterPassword() {
  const v = registerForm.password
  if (!v) registerErrors.password = '请输入密码'
  else if (v.length < 8) registerErrors.password = '密码至少需要 8 个字符'
}

function hasLoginErrors(): boolean {
  validateLoginEmail()
  validateLoginPassword()
  return !!(loginErrors.email || loginErrors.password)
}

function hasRegisterErrors(): boolean {
  validateRegisterUsername()
  validateRegisterEmail()
  validateRegisterPassword()
  return !!(registerErrors.username || registerErrors.email || registerErrors.password)
}

// ── 提交 ──
async function handleLogin() {
  if (hasLoginErrors()) return
  loginError.value = ''
  const err = await doLogin({
    email: loginForm.email.trim(),
    password: loginForm.password,
  })
  if (err) loginError.value = err
}

async function handleRegister() {
  if (hasRegisterErrors()) return
  registerError.value = ''
  const err = await doRegister({
    username: registerForm.username.trim(),
    email: registerForm.email.trim(),
    password: registerForm.password,
  })
  if (err) registerError.value = err
}

// ── Telegram Login Widget ──
// 关键认知（改这部分前先读 telegram-widget.js 源码逻辑，避免重蹈"销毁重建"覆辙）：
// 1. Telegram 脚本为每个 bot 生成 document 内 id 唯一的 iframe（telegram-login-{bot}）。
//    若该 iframe 仍挂在 document 上，再 append 脚本只会被 existsEl 分支复用它 → 重建无效。
//    因此本页每次重建前必先 replaceChildren() 物理移除旧 iframe（见 initTelegramWidget）。
// 2. auth 结果可经 URL hash(#tgAuthResult=...) 兜底回传：脚本一执行就同步读 hash 触发
//    onTelegramAuth → 若残留旧 hash，重开弹窗会"自动登录老账号"。挂载前必须先清 hash。
// 3. 弹窗 v-if 卸载会把 Teleport 内容(含 iframe)一并销毁，故每次打开都重新 init；
//    脚本对 window message 监听的累积无冲突（handler 按 event.source 匹配各自 iframe）。
const telegramContainer = ref<HTMLElement | null>(null)
const telegramError = ref('')
const telegramWidgetLoading = ref(false) // 脚本加载中
const telegramReady = ref(false) // widget iframe 就绪
const showTgSwitchGuide = ref(false) // 「切换账号」引导面板是否展开
const telegramUnavailable = ref(false) // 连不上 Telegram 服务（断网/未开代理/被屏蔽/超时），widget 不可用
const telegramUnavailableMsg = ref('') // 连不上 TG 时的友好提示文案
const { telegramBotUsername } = useRuntimeConfig().public

/** Telegram 生成的 iframe id（按其源码规则：bot 名非 [a-z0-9_] 字符转 -） */
function tgIframeId(): string {
  return 'telegram-login-' + (telegramBotUsername || '').replace(/[^a-z0-9_]/gi, '-')
}

/** 清理 URL 中残留的 tgAuthResult（Telegram auth 兜底结果），杜绝脚本加载即自动授权旧账号 */
function clearTgAuthHash() {
  if (import.meta.server) return
  try {
    const url = window.location.href
    const hashIdx = url.indexOf('#')
    if (hashIdx < 0) return
    const before = url.slice(0, hashIdx)
    let hash = url.slice(hashIdx)
    const cleaned = hash.replace(/[?&]tgAuthResult=[^&#]*/gi, '')
    // hash 清理后为空或只剩 '#' 时整段移除，避免无意义空 hash
    const finalUrl = (!cleaned || cleaned === '#') ? before : before + cleaned
    window.history.replaceState(window.history.state, '', finalUrl)
  } catch {
    // replaceState 失败（如 file:// 等）时静默，不影响登录主流程
  }
}

/** 网络/代理问题导致的"连不上 TG"加载失败最大等待时间：超过即判失败并友好提示，避免弹窗无限转圈 */
const TG_LOAD_TIMEOUT_MS = 12000
/** 脚本加载超时看门狗计时器 */
let telegramLoadTimer: ReturnType<typeof setTimeout> | undefined
/** iframe 载入兜底（1.2s）计时器 */
let telegramIframeFallbackTimer: ReturnType<typeof setTimeout> | undefined

/** 取消所有 Telegram 加载计时器：防止重试/重开后旧计时器误触发把新 cycle 置为就绪 */
function clearTelegramLoadTimer() {
  if (telegramLoadTimer) {
    clearTimeout(telegramLoadTimer)
    telegramLoadTimer = undefined
  }
  if (telegramIframeFallbackTimer) {
    clearTimeout(telegramIframeFallbackTimer)
    telegramIframeFallbackTimer = undefined
  }
}

/**
 * Telegram 服务不可达（断网 / 未开代理 / 被屏蔽 / 超时）的统一降级入口：
 * 清空容器、收掉 loading，切换成"连不上 TG"的友好提示面板，绝不让弹窗卡死或一直转圈。
 * 具体文案由调用方按场景给出（国内未开代理访问不到 Telegram 的情况尤其要说明）。
 */
function failTelegramLoad(msg: string) {
  clearTelegramLoadTimer()
  telegramContainer.value?.replaceChildren() // 清掉可能残留的 script/iframe，避免重试时 iframe id 冲突
  telegramWidgetLoading.value = false
  telegramReady.value = false
  telegramUnavailableMsg.value = msg
  telegramUnavailable.value = true
}

/** 挂载 Telegram 登录脚本（每次弹窗打开 / 切换账号都重建 iframe，见文件头注释） */
function mountTelegramScript() {
  if (import.meta.server) return
  clearTelegramLoadTimer() // 中止上一轮可能未触发的计时器
  if (!telegramContainer.value) {
    failTelegramLoad('Telegram 登录组件容器未就绪，请刷新页面重试')
    return
  }

  // 全局回调：Telegram widget 授权后把 user 对象回传（data-onauth 调用 window.onTelegramAuth）
  ;(window as any).onTelegramAuth = (user: TelegramAuthInput) => handleTelegramAuth(user)

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.setAttribute('data-telegram-login', telegramBotUsername)
  // 响应式尺寸：移动端 medium，桌面端 large
  const isMobile = window.innerWidth < 640
  script.setAttribute('data-size', isMobile ? 'medium' : 'large')
  script.setAttribute('data-userpic', 'false')
  script.setAttribute('data-onauth', 'onTelegramAuth(user)')

  script.onload = () => {
    clearTelegramLoadTimer()
    // 脚本同步执行后 iframe 已插入容器；等待 iframe 内嵌 oauth 页加载完成再收起 loading
    const iframe = document.getElementById(tgIframeId())
    if (iframe) {
      iframe.addEventListener('load', () => finishLoading())
      // oauth.telegram.org 本体连不上（脚本可达但 oauth 被屏蔽的边界场景）→ 也走友好提示
      iframe.addEventListener('error', () =>
        failTelegramLoad('无法加载 Telegram 登录组件，请检查网络 / 代理后重试'))
    }
    // 兜底：iframe load 事件可能受跨域/网络影响不触发，最多等 1.2s 必收起（避免无限转圈）
    telegramIframeFallbackTimer = setTimeout(finishLoading, 1200)
  }
  script.onerror = () => {
    clearTelegramLoadTimer()
    // 脚本 fetch 失败：多为 telegram.org 被网络屏蔽（国内未开代理的典型场景）
    failTelegramLoad('无法连接 Telegram 登录服务。部分网络环境（如未开启代理）访问不到 Telegram，可稍后重试，或用上方邮箱登录。')
  }
  telegramContainer.value.appendChild(script)

  // 超时看门狗：脚本既无 onload 也无 onerror（连接被挂起，被墙时常见）→ 到时判失败，绝不无限转圈
  telegramLoadTimer = setTimeout(() => {
    if (telegramWidgetLoading.value) {
      failTelegramLoad('连接 Telegram 登录服务超时。部分网络环境（如未开启代理）访问不到 Telegram，请检查网络 / 代理后重试。')
    }
  }, TG_LOAD_TIMEOUT_MS)
}

/** 收起 loading，标记就绪（仅当确实在加载中且未被判"连不上 TG"时才生效，防旧计时器误触发） */
function finishLoading() {
  if (telegramWidgetLoading.value && !telegramUnavailable.value) {
    telegramWidgetLoading.value = false
    telegramReady.value = true
  }
}

/** 初始化 / 重载 widget：先复位"连不上 TG"状态，再清残留 hash、清空容器重建 iframe */
function initTelegramWidget() {
  if (import.meta.server || !telegramContainer.value) return

  clearTelegramLoadTimer() // 中止上一轮可能未触发的计时器
  telegramUnavailable.value = false
  telegramUnavailableMsg.value = ''
  // 浏览器离线：直接给友好提示，不必等脚本请求超时
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    failTelegramLoad('当前网络不可用，暂时无法连接 Telegram 登录服务。恢复网络后将自动重试。')
    return
  }

  clearTgAuthHash()
  telegramContainer.value.replaceChildren() // 清掉可能残留的旧 script/iframe，确保新 iframe 无 id 冲突
  telegramWidgetLoading.value = true
  telegramReady.value = false
  mountTelegramScript()
}

/** 从"连不上 TG"面板手动重试：清错误、重新初始化 widget */
function retryTelegramWidget() {
  telegramError.value = ''
  initTelegramWidget()
}

async function handleTelegramAuth(user: TelegramAuthInput) {
  telegramError.value = ''
  const result = await telegramLogin(user)

  if (result.error) {
    telegramError.value = result.error
  } else {
    // 成功后主动清理 URL 上可能残留的 tgAuthResult，防止下次打开弹窗时自动登录
    clearTgAuthHash()
    // 等待 Vue 响应式更新完成，确保移动端弹窗稳定关闭
    await nextTick()
    showAuthModal.value = false

    // 新用户欢迎：走全局 toast（default.vue 的 welcome 引导另负责首次操作指引，这里只给即时反馈）
    if (result.isNewUser) {
      toast.add({
        title: '欢迎加入 AI Base 🎉',
        description: '去签到 / 发帖赚鸡腿，逛逛商店换装扮吧',
        color: 'success',
      })
    }
  }
}

/**
 * 用户主动切换 Telegram 账号。
 *
 * 曾实现为整页跳 `oauth.telegram.org/auth/logout` 登出本站授权后回站重开弹窗选新号，
 * 但测试服真机验证该跳转不生效：Telegram 侧登出链接带会话 hash（外部不可得），裸 URL 只会
 * 回到旧账号的一键授权页（见 docs/Telegram登录优化修复-2026-09-02.md §八）。重建 iframe 同理无效。
 *
 * 因此改为**引导式**：不自动跳转，展开引导面板，指引用户在 Telegram 侧（设置 → 隐私与安全 →
 * 已连接网站 / 登录授权）移除本 bot 授权后，回来用新账号重新授权登录。这是 Telegram 的机制限制，
 * 网站侧无自动化换号路径，避免给用户"点一下就能换"的错误预期。
 */
function handleSwitchTelegramAccount() {
  if (telegramWidgetLoading.value) return // 脚本加载中忽略点击
  telegramError.value = ''
  showTgSwitchGuide.value = true
}

/** 用户按引导断开授权后调用：收起引导并重载 widget，使其反映最新的 Telegram 会话状态 */
function reloadTelegramWidget() {
  showTgSwitchGuide.value = false
  telegramError.value = ''
  initTelegramWidget()
}

// 网络可达性监听：断网 / 恢复联网时对 Telegram widget 做即时反馈。
// 场景：国内用户未开代理访问不到 telegram.org/oauth → 脚本请求被挂起或失败，
// 必须给友好提示（见 failTelegramLoad），而不是让弹窗一直转圈或白屏。

/** 网络恢复：若正停在"连不上 TG"面板上，自动重载 widget（用户开代理 / 切回有网后无感续上） */
function handleTelegramNetOnline() {
  if (telegramUnavailable.value && showAuthModal.value) retryTelegramWidget()
}

/** 断网：若 widget 正加载中，立即降级提示，不必干等 12s 看门狗 */
function handleTelegramNetOffline() {
  if (telegramWidgetLoading.value && !telegramReady.value) {
    failTelegramLoad('当前网络不可用，暂时无法连接 Telegram 登录服务。恢复网络后将自动重试。')
  }
}

onMounted(() => {
  window.addEventListener('online', handleTelegramNetOnline)
  window.addEventListener('offline', handleTelegramNetOffline)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', handleTelegramNetOnline)
  window.removeEventListener('offline', handleTelegramNetOffline)
  clearTelegramLoadTimer()
})

// 弹窗打开时初始化 widget（每次打开重建，iframe 在关闭时已被 v-if 销毁）
// immediate：防止「挂载时弹窗已为开」的漏初始化（如父组件在 AuthModal 挂载前就置 true 了 showAuthModal），
// 此刻不会再有 false→true 的变化触发 watch，需在挂载时按当前值初始化
watch(showAuthModal, (open) => {
  if (open) nextTick(initTelegramWidget)
}, { immediate: true })

// 弹窗打开时聚焦
watch(showAuthModal, (open) => {
  if (open) {
    nextTick(() => {
      if (tab.value === 'login') loginEmailRef.value?.focus()
      else registerUsernameRef.value?.focus()
    })
  }
})
</script>

<style scoped>
/* 弹窗装饰底：极淡白色遮罩压住氛围图，营造通透背景（UI 升级阶段3：内联 style 抽到 scoped class） */
.auth-decor {
  background-image: linear-gradient(rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.78)), url('/images/auth-decor.webp');
  background-size: cover;
  background-position: center;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>
