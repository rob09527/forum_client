<template>
  <NuxtLink :to="`/post/${post.id}`" class="block">
    <article class="px-6 py-4 hover:bg-zinc-800/50 transition-colors">
      <div class="flex items-start gap-3">
        <Avatar :username="post.author.username" :avatar="post.author.avatar" size="md" class="mt-0.5" />
        <div class="flex-1 min-w-0">
          <!-- 标题 -->
          <h3 class="text-sm text-zinc-200 hover:text-blue-400 transition-colors leading-snug mb-1.5">
            <span v-if="post.isPinned" class="text-emerald-400 mr-1">📌</span>
            {{ post.title }}
          </h3>
          <!-- 元信息行 -->
          <div class="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
            <span :class="['px-1.5 py-0.5 rounded text-xs font-medium', badgeClass]">
              {{ categoryName(post.category) }}
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="text-[11px]">👤</span>
              <span class="text-zinc-400">{{ post.author.username }}</span>
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="text-[11px]">⏱</span>
              <span>{{ timeText }}</span>
            </span>
            <span v-if="post.lastReplyUser" class="inline-flex items-center gap-1">
              <span class="text-[11px]">💬</span>
              <span class="text-zinc-400">{{ post.lastReplyUser }}</span>
            </span>
            <span class="inline-flex items-center gap-1 ml-auto">
              <span class="text-[11px]">👁</span>
              <span class="font-mono text-xs text-zinc-500">{{ formatCount(post.viewCount) }}</span>
            </span>
          </div>
        </div>
        <!-- 评论数 -->
        <div class="flex-shrink-0 text-right min-w-[3rem]">
          <div class="text-xs font-mono font-medium text-zinc-300">{{ post.commentCount }}</div>
          <div class="text-[10px] text-zinc-500">回复</div>
        </div>
      </div>
    </article>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { PostListItem } from '~/types'
import { categoryBadge, categoryName } from '~/constants/categories'
import { formatCount } from '~/utils/format'

const props = defineProps<{
  post: PostListItem
}>()

const badgeClass = computed(() => categoryBadge(props.post.category))

const timeText = useTimeAgo(() => new Date(props.post.createdAt))
</script>
