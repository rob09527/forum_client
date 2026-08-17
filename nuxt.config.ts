import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-01',

  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@vueuse/nuxt'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // 仅在服务端可用
    apiBase: 'http://localhost:3001',
    // 公开运行时配置（客户端可用，可用 NUXT_PUBLIC_TELEGRAM_BOT_USERNAME 环境变量覆盖）
    public: {
      // Telegram Login Widget 的 bot username（公开值，非 secret）
      telegramBotUsername: 'forum_test_7132_bot',
    },
  },

  nitro: {
    devProxy: {
      '/api': 'http://127.0.0.1:3001/api',
      '/uploads': 'http://127.0.0.1:3001/uploads',
    },
  },

  devServer: {
    port: 3000,
  },
})
