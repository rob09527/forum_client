import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-01',

  devtools: { enabled: true },

  // 站点级 head：标签页展示品牌名 AI Base + favicon（此前缺失，测试服标签页只显示域名）
  app: {
    head: {
      title: 'AI Base',
      meta: [
        { name: 'description', content: 'AI Base —— 积分消费、打赏悬赏、店铺装扮的社区论坛' },
        { name: 'theme-color', content: '#2563eb' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  modules: ['@nuxt/ui', '@vueuse/nuxt'],

  // 组件按文件名的 PascalCase 命名,子目录不加前缀(与现有 post/PostForm、comment/CommentItem 约定一致)
  components: [{ path: '~/components', pathPrefix: false }],

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
