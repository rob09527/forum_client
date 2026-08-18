<template>
  <header class="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-700/50 -mx-4 lg:-mx-8 px-4 lg:px-8">
    <!-- Row 1: Logo + 搜索 + 用户 -->
    <div class="flex items-center h-12">
      <!-- Logo（占位与左栏同宽，使搜索栏左边缘与帖子列表对齐） -->
      <a href="/" class="flex items-center gap-2 text-base font-bold tracking-tight whitespace-nowrap flex-shrink-0 lg:w-44">
        <span class="text-lg leading-none">🤖</span>
        <span class="text-blue-400">AI Base</span>
      </a>

      <!-- 搜索（左对齐帖子列表后，再整体右移 5%） -->
      <div class="relative flex-1 max-w-md ml-4 lg:ml-[calc(2rem+5%)]">
        <input
          v-model="searchText"
          type="text"
          placeholder="搜索帖子、用户…"
          class="w-full h-8 pl-8 pr-3 text-sm bg-zinc-800 border border-zinc-600/50 rounded-md
                 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                 transition-all"
          @keyup.enter="handleSearch"
        />
        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">🔍</span>
      </div>

      <!-- 用户区（靠右） -->
      <div class="ml-auto flex-shrink-0 flex items-center gap-2">
        <!-- 未登录：登录 + 注册 -->
        <template v-if="!isLoggedIn">
          <button
            class="px-3 py-1 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded-md transition-colors"
            @click="openLogin"
          >
            登录
          </button>
          <button
            class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            @click="openRegister"
          >
            注册
          </button>
        </template>
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
defineProps<{
  subTags: string[]
  activeSubTag: string
}>()

defineEmits<{
  'toggle-sub-tag': [tag: string]
}>()

const { user, isLoggedIn, logout, openLogin, openRegister } = useAuth()

const showDropdown = ref(false)

// 顶栏搜索：回车跳转 /search?q=…（当前仅搜索帖子，占位文案保留）
const searchText = ref('')

function handleSearch() {
  const q = searchText.value.trim()
  if (!q) return
  navigateTo({ path: '/search', query: { q } })
}

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
