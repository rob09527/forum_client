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
      '/api': 'http://127.0.0.1:3001/api',
      '/uploads': 'http://127.0.0.1:3001/uploads',
    },
  },

  devServer: {
    port: 3000,
  },
})
