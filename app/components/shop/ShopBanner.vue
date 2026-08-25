<template>
  <button
    v-if="nearest"
    class="panel w-full flex items-center gap-2 px-6 py-3 text-sm text-amber-700 hover:bg-amber-50/60 transition-colors text-left"
    @click="goMine"
  >
    <span>⏰</span>
    <span>
      「{{ nearest.renderValue }}」还有
      <span class="font-semibold">{{ nearest.daysLeft }} 天</span> 到期，去续费 →
    </span>
  </button>
</template>

<script setup lang="ts">
import type { ShopExpiringItem } from '~/types'

/**
 * 到期提醒横幅 [1.3.4]：取临近到期中最近的一条，点击进入「我的装饰」续费。
 * 剩余时间由后端计算（remindDays 内进入 expiringSoon[]）。
 */
const props = defineProps<{ items: ShopExpiringItem[] }>()

const router = useRouter()

/** 取离到期最近的一条（daysLeft 最小） */
const nearest = computed(() =>
  props.items.slice().sort((a, b) => a.daysLeft - b.daysLeft)[0]
)

function goMine() {
  router.push({ path: '/shop', query: { tab: 'mine' } })
}
</script>
