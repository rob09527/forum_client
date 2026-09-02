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
                <span class="text-sm text-gray-500">{{ telegramReloading ? '正在切换，请稍候...' : '加载 Telegram 登录...' }}</span>
              </div>
              <div ref="telegramContainer" class="w-full flex justify-center" />
            </div>

            <!-- 切换账号提示（仅在 Widget 就绪后显示） -->
            <div v-if="telegramReady" class="mt-2 text-center">
              <button
                type="button"
                class="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                :disabled="telegramWidgetLoading"
                @click="handleSwitchTelegramAccount"
              >
                使用其他 Telegram 账号登录
              </button>
            </div>
            <p v-if="telegramReady" class="text-[11px] text-gray-400 text-center mt-1">
              切换账号需在 Telegram 授权窗口中确认
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
const telegramWidgetLoading = ref(false) // 脚本加载 / 重载中
const telegramReloading = ref(false) // 是否由"切换账号"触发（文案区分）
const telegramReady = ref(false) // widget iframe 就绪
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

/** 挂载 Telegram 登录脚本（每次弹窗打开 / 切换账号都重建 iframe，见文件头注释） */
function mountTelegramScript() {
  if (import.meta.server || !telegramContainer.value) return

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
    // 脚本同步执行后 iframe 已插入容器；等待 iframe 内嵌 oauth 页加载完成再收起 loading
    const iframe = document.getElementById(tgIframeId())
    if (iframe) {
      iframe.addEventListener('load', () => finishLoading())
    }
    // 兜底：iframe load 事件可能受跨域/网络影响不触发，最多等 1.2s 必收起（避免无限转圈）
    setTimeout(finishLoading, 1200)
  }
  script.onerror = () => {
    telegramError.value = 'Telegram 登录组件加载失败，请刷新页面后重试'
    telegramWidgetLoading.value = false
    telegramReady.value = true // 保留切换按钮便于重试
  }
  telegramContainer.value.appendChild(script)
}

/** 收起 loading，标记就绪 */
function finishLoading() {
  telegramWidgetLoading.value = false
  telegramReloading.value = false
  telegramReady.value = true
}

/** 初始化 / 重载 widget：先清残留 hash，再清空容器重建 iframe */
function initTelegramWidget() {
  if (import.meta.server || !telegramContainer.value) return

  clearTgAuthHash()
  telegramContainer.value.replaceChildren() // 清掉可能残留的旧 script/iframe，确保新 iframe 无 id 冲突
  telegramWidgetLoading.value = true
  telegramReady.value = false
  mountTelegramScript()
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

    if (result.isNewUser) {
      // 新用户欢迎提示（延迟 300ms，确保弹窗关闭动画完成）
      setTimeout(() => {
        // TODO: 接入 toast 通知组件
        console.log('🎉 欢迎加入 AI Base！')
      }, 300)
    }
  }
}

/** 用户主动切换 Telegram 账号：清残留 hash + 重建 widget，让 Telegram 重新走授权 */
function handleSwitchTelegramAccount() {
  if (telegramWidgetLoading.value) return // 已在加载/重载中，忽略连点
  telegramReloading.value = true
  initTelegramWidget()
}

// 弹窗打开时初始化 widget（每次打开重建，iframe 在关闭时已被 v-if 销毁）
watch(showAuthModal, (open) => {
  if (open) nextTick(initTelegramWidget)
})

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
