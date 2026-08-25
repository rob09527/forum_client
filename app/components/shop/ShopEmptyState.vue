<template>
  <div class="panel p-10 text-center">
    <div class="text-3xl mb-3">🪞</div>
    <p class="text-sm text-zinc-600">
      距离第一件装饰还差
      <span class="text-amber-600 font-semibold">{{ missing }} 🍗</span>
    </p>
    <NuxtLink to="/checkin" class="inline-block mt-3 text-sm text-blue-600 hover:text-blue-500 transition-colors">
      去签到 →
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
/**
 * 0 积分引导 [1.3.6][3.2]：余额不足最便宜商品时展示「还差 N 🍗 · 去签到 →」。
 * 只做一条链路（签到赚鸡腿），不做复杂推荐。
 */
defineProps<{
  /** 距离最便宜商品的缺口（最便宜价 − 当前余额） */
  missing: number
}>()
</script>
