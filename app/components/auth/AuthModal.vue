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

            <!-- Telegram Login Widget 容器（脚本加载后在此渲染官方登录按钮） -->
            <div v-if="!widgetReady" class="w-full flex justify-center py-4">
              <div class="flex items-center gap-2 text-gray-500">
                <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span class="text-sm">加载 Telegram 登录...</span>
              </div>
            </div>
            <div v-show="widgetReady" ref="telegramContainer" class="w-full flex justify-center" />

            <!-- 切换账号提示（仅在 Widget 已加载时显示） -->
            <div v-if="widgetReady" class="mt-2 text-center">
              <button
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isResetting"
                @click="handleSwitchTelegramAccount"
              >
                {{ isResetting ? '正在重置...' : '使用其他 Telegram 账号登录' }}
              </button>
            </div>

            <!-- Telegram 错误提示（增强样式） -->
            <div v-if="telegramError" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600">{{ telegramError }}</p>
              <p class="text-xs text-red-500 mt-1">如果问题持续出现，请尝试清除浏览器缓存</p>
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
  resetTelegramWidget,
  switchTelegramAccount,
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
const telegramContainer = ref<HTMLElement | null>(null)
const telegramError = ref('')
const widgetLoaded = ref(false)
const widgetReady = ref(false)
const isResetting = ref(false) // 防止重复重置
const { telegramBotUsername } = useRuntimeConfig().public

function loadTelegramWidget() {
  console.log('[TG Widget] loadTelegramWidget 被调用', {
    isServer: import.meta.server,
    hasContainer: !!telegramContainer.value,
    widgetLoaded: widgetLoaded.value,
  })

  if (import.meta.server || !telegramContainer.value || widgetLoaded.value) {
    console.log('[TG Widget] loadTelegramWidget 提前返回')
    return
  }

  console.log('[TG Widget] 开始加载 Widget')
  widgetLoaded.value = true // 标记开始加载，防止重复

  // 全局回调：Telegram widget 授权后把 user 对象回传（data-onauth 调用 window.onTelegramAuth）
  ;(window as any).onTelegramAuth = (user: TelegramAuthInput) => handleTelegramAuth(user)

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.setAttribute('data-telegram-login', telegramBotUsername)

  // 响应式尺寸：移动端使用 medium，桌面端使用 large
  const isMobile = window.innerWidth < 640
  script.setAttribute('data-size', isMobile ? 'medium' : 'large')

  script.setAttribute('data-userpic', 'false')
  script.setAttribute('data-onauth', 'onTelegramAuth(user)')

  // 脚本加载完成后标记为 ready
  script.onload = () => {
    console.log('[TG Widget] Widget 加载完成')
    widgetReady.value = true
  }
  script.onerror = () => {
    console.error('[TG Widget] Widget 加载失败')
    widgetLoaded.value = false // 允许重试
  }

  telegramContainer.value.appendChild(script)
}

async function handleTelegramAuth(user: TelegramAuthInput) {
  telegramError.value = ''
  const result = await telegramLogin(user)

  if (result.error) {
    telegramError.value = result.error
  } else {
    // 成功后强制等待 Vue 响应式更新完成（修复手机端弹窗不关闭问题）
    await nextTick()

    // 确保弹窗关闭（showAuthModal 已在 telegramLogin 中设为 false，这里再次确保）
    showAuthModal.value = false

    if (result.isNewUser) {
      // 新用户欢迎提示（延迟 300ms，确保弹窗关闭动画完成）
      setTimeout(() => {
        // TODO: 使用 toast 通知
        console.log('🎉 欢迎加入 AI Base！')
      }, 300)
    }
  }
}

/** 用户主动切换 Telegram 账号 */
function handleSwitchTelegramAccount() {
  if (isResetting.value) {
    console.log('[TG Widget] 正在重置中，请稍候...')
    return
  }

  isResetting.value = true
  switchTelegramAccount()
  console.log('已清除 Telegram 登录信息，正在重新加载...')
}

// 弹窗打开时加载 widget（只加载一次）
watch(showAuthModal, (open) => {
  if (open && !widgetLoaded.value) {
    nextTick(loadTelegramWidget)
  }
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

// 监听退出登录后的 Widget 重置信号
watch(resetTelegramWidget, (shouldReset) => {
  if (shouldReset) {
    console.log('[TG Widget] 收到重置信号，开始清空...')
    widgetLoaded.value = false
    widgetReady.value = false
    if (telegramContainer.value) {
      telegramContainer.value.innerHTML = ''
      console.log('[TG Widget] 容器已清空')
    }
    resetTelegramWidget.value = false // 重置标志

    // 重置后立即重新加载 Widget
    console.log('[TG Widget] 准备重新加载...')
    nextTick(() => {
      loadTelegramWidget()
      // 加载完成后解除重置状态
      setTimeout(() => {
        isResetting.value = false
      }, 1000)
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
