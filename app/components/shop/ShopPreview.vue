<template>
  <div class="space-y-2 rounded-xl bg-zinc-50 p-4">
    <!-- 模拟帖子列表项 -->
    <div class="flex items-center gap-2">
      <Avatar :username="previewAuthor.username" :avatar="previewAuthor.avatar" size="sm" />
      <UsernameText :author="previewAuthor" />
      <span class="text-zinc-400 text-sm">· 预览效果</span>
    </div>
    <!-- 模拟评论 -->
    <div class="ml-8 rounded-lg bg-white p-3">
      <UsernameText :author="previewAuthor" />
      <p class="text-sm mt-1 text-zinc-500">这就是你戴上的样子</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShopItem } from '~/types'

/**
 * 试戴预览 [1.3.3][3.2]：用当前登录用户的真实用户名 + 待购 renderValue/renderStyle
 * 合成假 AuthorBrief，喂给全站统一的 <UsernameText> —— 所见即所得由复用保证，
 * 预览里是什么颜色/称号，买完在帖子里就是什么样子。不重写任何样式。
 */
const props = defineProps<{ item: ShopItem }>()

const { user } = useAuth()

/** 待购预览：把购买后的槽位合并进当前用户信息 */
const previewAuthor = computed(() => ({
  id: user.value?.id ?? 0,
  username: user.value?.username ?? '预览',
  avatar: props.item.type === 'avatar' ? props.item.renderValue : (user.value?.avatar ?? null),
  level: user.value?.level,
  decorColorValue: props.item.type === 'username_color' ? props.item.renderValue : null,
  decorColorExpireAt: null, // 预览不过期
  decorTitleValue: props.item.type === 'title' ? props.item.renderValue : null,
  decorTitleStyle: props.item.type === 'title' ? props.item.renderStyle : null,
  decorTitleExpireAt: null,
}))
</script>
