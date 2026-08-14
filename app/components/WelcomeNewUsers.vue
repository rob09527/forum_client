<template>
  <div class="bg-zinc-800 rounded-lg border border-zinc-700/50 p-4">
    <h4 class="text-xs text-zinc-500 font-medium mb-3 px-1">🎉 欢迎新用户 🎉</h4>
    <!-- 4 列 × 2 排，最多 8 个最新注册用户 -->
    <div class="grid grid-cols-4 gap-x-1 gap-y-2">
      <NuxtLink
        v-for="user in users.slice(0, 8)"
        :key="user.id"
        :to="`/user/${user.id}`"
        class="flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700/50 transition-colors group text-center"
      >
        <Avatar :username="user.username" :avatar="user.avatar" size="md" />
        <span class="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition-colors truncate w-full">{{ user.username }}</span>
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
