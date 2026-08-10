import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-01',

  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@vueuse/nuxt'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // 仅在服务端可用
    apiBase: 'http://localhost:3001',
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  vite: {
    server: {
      port: 3000,
    },
  },
})
