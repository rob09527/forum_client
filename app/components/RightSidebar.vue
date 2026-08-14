<template>
  <aside class="hidden lg:block w-80 flex-shrink-0 border-l border-zinc-700/50 h-[calc(100vh-5.5rem)] sticky top-[5.5rem] overflow-y-auto py-4 px-4 space-y-4">
    <!-- ====== 用户卡片：未登录 ====== -->
    <div v-if="!isLoggedIn" class="bg-zinc-800 rounded-lg border border-zinc-700/50 p-5 text-center">
      <div class="w-14 h-14 rounded-full bg-zinc-700 mx-auto mb-3 flex items-center justify-center text-2xl">
        👤
      </div>
      <p class="text-sm text-zinc-400 mb-3">登录后享受完整功能</p>
      <div class="flex gap-2">
        <button class="flex-1 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors" @click="openLogin">
          登录
        </button>
        <button class="flex-1 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-md transition-colors" @click="openRegister">
          注册
        </button>
      </div>
    </div>

    <!-- ====== 用户卡片：已登录 ====== -->
    <div v-else class="bg-zinc-800 rounded-lg border border-zinc-700/50 p-4">
      <div class="flex items-center gap-3 mb-3">
        <Avatar :username="user?.username" :avatar="user?.avatar" size="lg" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-zinc-200 truncate">{{ user?.username }}</p>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" :class="levelBadgeClass">
            {{ levelLabel }}
          </span>
        </div>
      </div>
      <!-- 积分 -->
      <div class="flex items-center gap-3 text-xs text-zinc-500 mb-3 px-1">
        <span class="flex items-center gap-1"><span class="text-amber-400">🍗</span> {{ user?.points ?? 0 }}</span>
        <span class="flex items-center gap-1"><span class="text-yellow-400">⭐</span> {{ user?.stars ?? 0 }}</span>
      </div>
      <button
        class="w-full py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-md transition-colors"
        @click="logout"
      >
        退出登录
      </button>
    </div>

    <!-- 侧边栏广告（position=sidebar，最多 10 条，依次排列在用户卡片下方） -->
    <AdSlot v-for="ad in sidebarAds" :key="ad.id" :ad="ad" />

    <!-- 快捷功能 -->
    <div class="bg-zinc-800 rounded-lg border border-zinc-700/50 p-4 space-y-1">
      <h4 class="text-xs text-zinc-500 font-medium mb-2 px-1">快捷功能</h4>
      <NuxtLink
        to="/post/new"
        class="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 rounded-md transition-colors w-full text-left"
      >
        <span>✏️</span> 发布新帖
      </NuxtLink>
      <NuxtLink
        to="/my/posts"
        class="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 rounded-md transition-colors w-full text-left"
      >
        <span>📝</span> 我的帖子
      </NuxtLink>
    </div>

    <!-- 热门帖子 -->
    <div class="bg-zinc-800 rounded-lg border border-zinc-700/50 p-4">
      <h4 class="text-xs text-zinc-500 font-medium mb-2 px-1">🔥 热门帖子</h4>
      <div class="space-y-1">
        <NuxtLink
          v-for="(hp, i) in hotPosts"
          :key="hp.id"
          :to="`/post/${hp.id}`"
          class="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-zinc-700/50 transition-colors group w-full text-left"
        >
          <span :class="['font-mono text-xs w-4 flex-shrink-0 mt-0.5', i < 3 ? 'text-amber-400' : 'text-zinc-500']">{{ i + 1 }}</span>
          <span class="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors leading-snug line-clamp-2">{{ hp.title }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- 欢迎新用户 -->
    <WelcomeNewUsers :users="newUsers" />
  </aside>
</template>

<script setup lang="ts">
import { UserLevelLabel } from '~/types'
import type { NewUser } from '~/types'
import { useAdverts } from '~/composables/useAdverts'

defineProps<{
  hotPosts: { id: number; title: string }[]
  newUsers: NewUser[]
}>()

const { user, isLoggedIn, logout, openLogin, openRegister } = useAuth()

// 侧边栏广告（position=sidebar，按 sortOrder 取前 10 条，全部排在用户卡片下方）
const { adverts } = useAdverts()
const sidebarAds = computed(() => adverts.value.filter((a) => a.position === 'sidebar').slice(0, 10))

const levelLabel = computed(() => UserLevelLabel[user.value?.level ?? ''] ?? user.value?.level ?? '')

const levelBadgeClass = computed(() => {
  const map: Record<string, string> = {
    claw: 'bg-zinc-700 text-zinc-400',
    leg: 'bg-amber-500/20 text-amber-400',
    meat: 'bg-red-500/20 text-red-400',
  }
  return map[user.value?.level ?? ''] ?? 'bg-zinc-700 text-zinc-400'
})
</script>
