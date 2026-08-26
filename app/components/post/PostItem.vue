<template>
  <article class="px-6 py-4 hover:bg-zinc-100 transition-colors">
    <div class="flex items-start gap-3">
      <!-- 头像 → 个人主页 -->
      <NuxtLink :to="`/user/${post.author.id}`" class="shrink-0 mt-0.5" :title="post.author.username">
        <Avatar :username="post.author.username" :avatar="post.author.avatar" size="md" />
      </NuxtLink>

      <!-- 正文 → 帖子详情 -->
      <NuxtLink :to="`/post/${post.id}`" class="flex-1 min-w-0 group">
        <!-- 标题 -->
        <h3 class="text-sm text-zinc-800 group-hover:text-blue-600 transition-colors leading-snug mb-1.5">
          <span v-if="post.isPinned" class="text-emerald-600 mr-1 inline-flex align-middle"><AppIcon name="pin" :size="13" /></span>
          {{ post.title }}
        </h3>
        <!-- 元信息行 -->
        <div class="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
          <span :class="['px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap', badgeClass]">
            {{ categoryName(post.category) }}
          </span>
          <!-- 悬赏徽章 [3.5]：bountyAmount 非空 → 琥珀色金额徽章（与鸡腿语义一致）；终态补状态角标 -->
          <span
            v-if="post.bountyAmount != null"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-600 whitespace-nowrap"
            :title="post.bountyStatus === 'escrow' ? '悬赏待采纳' : BountyStatusLabel[post.bountyStatus!]"
          >
            <AppIcon name="coins" :size="12" /> {{ post.bountyAmount }}
            <span v-if="post.bountyStatus && post.bountyStatus !== 'escrow'" class="font-normal">· {{ BountyStatusLabel[post.bountyStatus] }}</span>
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="text-zinc-400"><AppIcon name="user" :size="12" /></span>
            <!-- 外层已套 /post/:id 的 <NuxtLink>，这里 link=false 避免嵌套 <a> 导致 hydration 报错 -->
            <UsernameText :author="post.author" size="xs" :link="false" />
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="text-zinc-400"><AppIcon name="clock" :size="12" /></span>
            <span>{{ timeText }}</span>
          </span>
          <span v-if="post.lastReplyUser" class="inline-flex items-center gap-1">
            <span class="text-zinc-400"><AppIcon name="message-square" :size="12" /></span>
            <span class="text-zinc-600">{{ post.lastReplyUser }}</span>
          </span>
          <span class="inline-flex items-center gap-1 ml-auto">
            <span class="text-zinc-400"><AppIcon name="eye" :size="12" /></span>
            <span class="font-mono text-xs text-zinc-500">{{ formatCount(post.viewCount) }}</span>
          </span>
        </div>
      </NuxtLink>

      <!-- 评论数 → 帖子详情 -->
      <NuxtLink :to="`/post/${post.id}`" class="flex-shrink-0 text-right min-w-[3rem]">
        <div class="text-xs font-mono font-medium text-zinc-700">{{ post.commentCount }}</div>
        <div class="text-[10px] text-zinc-500">回复</div>
      </NuxtLink>

      <!-- 自定义尾部操作（如「我的收藏」的取消收藏按钮） -->
      <slot name="trailing" />
    </div>
  </article>
</template>

<script setup lang="ts">
import type { PostListItem } from '~/types'
import { BountyStatusLabel } from '~/types'
import { categoryBadge, categoryName } from '~/constants/categories'
import { formatCount } from '~/utils/format'

const props = defineProps<{
  post: PostListItem
}>()

const badgeClass = computed(() => categoryBadge(props.post.category))

const timeText = useTimeAgo(() => new Date(props.post.createdAt))
</script>
