<template>
  <header class="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700/50 -mx-4 lg:-mx-8 px-4 lg:px-8">
    <!-- Row 1: Logo + 主分类 + 搜索 + 用户 -->
    <div class="flex items-center h-12 gap-1">
      <a href="/" class="text-base font-bold text-blue-400 tracking-tight whitespace-nowrap mr-4">
        AI Base
      </a>
      <nav class="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
        <button
          v-for="cat in categories"
          :key="cat.slug"
          :class="[
            'px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors',
            activeCategory === cat.slug
              ? 'bg-blue-500/10 text-blue-400 font-medium'
              : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50'
          ]"
          @click="$emit('select-category', cat.slug)"
        >
          {{ cat.icon }} {{ cat.name }}
        </button>
      </nav>

      <!-- 搜索 -->
      <div class="relative ml-4 flex-shrink-0">
        <input
          type="text"
          placeholder="搜索..."
          class="w-48 h-8 pl-8 pr-3 text-sm bg-zinc-800 border border-zinc-600/50 rounded-md
                 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50
                 transition-colors"
        />
        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">🔍</span>
      </div>

      <!-- 用户区 -->
      <div class="ml-3 flex-shrink-0 flex items-center gap-2">
        <!-- 未登录 -->
        <button
          v-if="!isLoggedIn"
          class="px-3 py-1 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded-md transition-colors"
          @click="openLogin"
        >
          登录
        </button>
        <!-- 已登录 -->
        <div v-else class="relative" @click="toggleDropdown" @blur="closeDropdown">
          <button class="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-zinc-700/50 transition-colors text-left">
            <Avatar :username="user?.username" :avatar="user?.avatar" size="sm" />
            <span class="text-sm text-zinc-300 hidden xl:inline max-w-[80px] truncate">{{ user?.username }}</span>
          </button>
          <!-- 下拉菜单 -->
          <Transition name="dropdown">
            <div
              v-if="showDropdown"
              class="absolute right-0 top-full mt-1 w-44 bg-zinc-800 border border-zinc-700/50 rounded-lg shadow-xl overflow-hidden z-50"
            >
              <div class="px-4 py-3 border-b border-zinc-700/50">
                <p class="text-sm font-medium text-zinc-200 truncate">{{ user?.username }}</p>
                <p class="text-xs text-zinc-500 truncate">{{ user?.email }}</p>
              </div>
              <div class="py-1">
                <NuxtLink
                  :to="`/user/${user?.id}`"
                  class="w-full px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors text-left block"
                  @click="showDropdown = false"
                >
                  👤 个人主页
                </NuxtLink>
                <button class="w-full px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors text-left">
                  ⚙️ 设置
                </button>
              </div>
              <div class="border-t border-zinc-700/50 py-1">
                <button
                  class="w-full px-4 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 transition-colors text-left"
                  @click="handleLogout"
                >
                  🚪 退出
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Row 2: 子标签 -->
    <div class="flex items-center h-10 border-t border-zinc-800 overflow-x-auto scrollbar-none gap-1.5">
      <span class="text-xs text-zinc-500 mr-1 whitespace-nowrap">全部标签</span>
      <button
        v-for="tag in subTags"
        :key="tag"
        :class="[
          'px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors mr-1.5',
          activeSubTag === tag
            ? 'bg-blue-500 text-white'
            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50'
        ]"
        @click="$emit('toggle-sub-tag', activeSubTag === tag ? '' : tag)"
      >
        {{ tag }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { Category } from '~/types'

defineProps<{
  categories: Category[]
  subTags: string[]
  activeCategory: string
  activeSubTag: string
}>()

defineEmits<{
  'select-category': [slug: string]
  'toggle-sub-tag': [tag: string]
}>()

const { user, isLoggedIn, logout, openLogin } = useAuth()

const showDropdown = ref(false)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function closeDropdown() {
  setTimeout(() => { showDropdown.value = false }, 150)
}

async function handleLogout() {
  showDropdown.value = false
  await logout()
}

</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
