<template>
  <!-- 无打赏不渲染；加载中占位避免闪烁 -->
  <div v-if="loading" class="py-1" />
  <div v-else-if="tips.items.length" class="flex items-center gap-3 py-1">
    <button
      class="flex items-center gap-2 group"
      title="查看打赏明细"
      @click="showList = true"
    >
      <!-- 头像堆叠（最多 5 个），复用全站 Avatar（默认头像/风格统一） -->
      <span class="flex -space-x-2">
        <Avatar
          v-for="t in tips.items.slice(0, 5)"
          :key="t.id"
          :username="t.fromUser.username"
          :avatar="t.fromUser.avatar"
          size="xs"
          class="border-2 border-white"
        />
      </span>
      <span class="text-sm text-zinc-600 group-hover:text-amber-700 transition-colors">
        🍗 <span class="font-medium">{{ tips.total }}</span> 人打赏
        · 共 <span class="font-medium">{{ tips.totalAmount }}</span>
      </span>
    </button>

    <!-- 打赏明细弹窗 -->
    <TipListModal v-model="showList" :items="tips.items" />
  </div>
</template>

<script setup lang="ts">
import type { PostTipsResult } from '~/types'
import { useTip } from '~/composables/useTip'

/**
 * 帖子打赏汇总 [1.5.3][3.4]：`🍗 N 人打赏 · 共 X` + 头像堆叠，点击展开明细。
 * 数据由 useTip().fetchPostTips 拉取；`refreshKey` 变化（打赏成功后由父页面递增）时重新拉取。
 */
const props = defineProps<{
  postId: number
  /** 打赏成功后父页面递增，触发重新拉取 */
  refreshKey: number
}>()

const { fetchPostTips } = useTip()

const tips = ref<PostTipsResult>({ items: [], total: 0, totalAmount: 0 })
const loading = ref(true)
const showList = ref(false)

async function load() {
  loading.value = true
  try {
    tips.value = await fetchPostTips(props.postId)
  } catch (err: any) {
    // 列表可静默失败，不打断阅读
    tips.value = { items: [], total: 0, totalAmount: 0 }
  } finally {
    loading.value = false
  }
}

// 客户端拉取（optionalAuth，但保持与全站一致客户端加载）
onMounted(load)
watch(() => props.refreshKey, load)
</script>
