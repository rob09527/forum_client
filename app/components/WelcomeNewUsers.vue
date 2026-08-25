<template>
  <div class="panel p-4">
    <!-- 🎉 为庆祝装饰性 emoji（非功能图标位），无对应 lucide 映射，按保留例外处理（UI 升级阶段2） -->
    <h4 class="text-xs text-zinc-500 font-medium mb-3 px-1">🎉 欢迎新用户 🎉</h4>
    <!-- 4 列 × 2 排，最多 8 个最新注册用户 -->
    <div class="grid grid-cols-4 gap-x-1 gap-y-2">
      <NuxtLink
        v-for="user in users.slice(0, 8)"
        :key="user.id"
        :to="`/user/${user.id}`"
        class="flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-100 transition-colors group text-center"
      >
        <Avatar :username="user.username" :avatar="user.avatar" size="md" />
        <!-- 外层 NuxtLink 已跳转主页，此处 link=false 避免嵌套 <a>；装饰色同样生效 -->
        <UsernameText :author="user" size="xs" :link="false" class="w-full justify-center" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NewUser } from '~/types'

defineProps<{
  users: NewUser[]
}>()
</script>
