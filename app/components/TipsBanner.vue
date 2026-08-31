<template>
  <!-- 首页小 tips 轮播：替代固定品牌标语，克制不占位，每 6s 换一条 -->
  <ClientOnly>
    <div class="flex items-center gap-1.5 px-1 min-h-5">
      <span class="text-zinc-400 leading-none" aria-hidden="true">
        <AppIcon name="sparkles" :size="12" />
      </span>
      <Transition name="tip" mode="out-in">
        <span :key="tipIndex" class="text-[13px] text-zinc-500 leading-5">
          {{ HOME_TIPS[tipIndex % HOME_TIPS.length] }}
        </span>
      </Transition>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { HOME_TIPS } from '~/constants/tips'

/** 轮播间隔（毫秒） */
const TIP_INTERVAL_MS = 6000

/** 当前展示的 tip 索引 */
const tipIndex = ref(0)

/** 定时器句柄（普通变量，不需要响应式） */
let tipTimer: ReturnType<typeof setInterval> | undefined

/** 启动轮播定时器 */
function startTipTicker() {
  stopTipTicker()
  tipTimer = setInterval(() => {
    tipIndex.value = (tipIndex.value + 1) % HOME_TIPS.length
  }, TIP_INTERVAL_MS)
}

/** 停止轮播定时器 */
function stopTipTicker() {
  if (tipTimer) clearInterval(tipTimer)
  tipTimer = undefined
}

onMounted(startTipTicker)
onBeforeUnmount(stopTipTicker)
</script>

<style scoped>
/** 小 tips 轮播的淡入淡出切换动画：旧条淡出上移，新条淡入上移进入 */
.tip-enter-active,
.tip-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.tip-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.tip-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
