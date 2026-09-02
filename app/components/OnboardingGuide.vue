<template>
  <!-- 非模态新手引导卡片：不遮罩、不拦截点击、不强制停留。
       桌面固定在右下角，移动端悬在底部导航上方，像一条提醒横幅一样自然。 -->
  <Teleport to="body">
    <Transition name="ob-pop">
      <div v-if="state.active" class="ob-card" role="dialog" aria-label="新手引导">
        <div class="ob-card__head">
          <span v-if="state.total > 1" class="ob-card__progress">{{ state.progress }}</span>
          <button class="ob-card__close" aria-label="关闭引导" @click="onFinish">✕</button>
        </div>

        <p class="ob-card__title">{{ state.step?.title }}</p>
        <p class="ob-card__desc">{{ state.step?.description }}</p>

        <div class="ob-card__actions">
          <button v-if="!state.isFirst" class="ob-btn ob-btn--ghost" @click="onPrev">← 上一步</button>
          <button v-if="!state.isLast" class="ob-btn ob-btn--primary" @click="onNext">下一步 →</button>
          <button v-else class="ob-btn ob-btn--primary" @click="onFinish">开始探索 🎉</button>

          <span class="ob-card__skip" role="button" tabindex="0" @click="onFinish" @keydown.enter="onFinish">跳过引导</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 新手引导渲染组件。
 *
 * 只负责「读状态 + 发指令」，具体状态机与步骤数据都在 useOnboarding.ts。
 * 每个步骤若声明了 target 选择器，会尽力给对应元素加高亮描边（纯视觉，不影响点击）；
 * 元素找不到时卡片照常显示，不报错。
 */
const { tourState, next, prev, finish } = useOnboarding()

const state = computed(() => tourState.value)

/** 当前被高亮的元素引用，用于步骤切换时清理 */
let highlightedEl: Element | null = null

function clearHighlight() {
  highlightedEl?.classList.remove('ob-target')
  highlightedEl = null
}

function applyHighlight() {
  const target = state.value.step?.target
  if (!target) return

  const el = document.querySelector(target)
  if (!el) return

  el.classList.add('ob-target')
  highlightedEl = el

  // 只在元素完全不在视口内时温和滚到可见，不打断用户当前浏览位置
  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const visible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= vh && rect.right <= vw
  if (!visible) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 步骤切换后（DOM 就绪）更新高亮
watch(
  () => [state.value.index, state.value.active],
  () => {
    clearHighlight()
    if (state.value.active) applyHighlight()
  },
  { flush: 'post' }
)

onMounted(() => {
  if (state.value.active) applyHighlight()
})

onBeforeUnmount(clearHighlight)

function onNext() { next() }
function onPrev() { prev() }
function onFinish() { clearHighlight(); finish() }
</script>

<style scoped>
/* ---- 引导卡片本体（非模态，悬浮于页面之上） ---- */
.ob-card {
  position: fixed;
  z-index: 60;
  background: #fff;
  border: 1px solid rgb(59 130 246 / 0.18);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgb(15 23 42 / 0.18);
  padding: 16px 18px;
  width: 360px;
  max-width: calc(100vw - 24px);
  color: #18181b;
  font-size: 14px;
  line-height: 1.6;
}

/* 桌面：右下角 */
@media (min-width: 640px) {
  .ob-card {
    right: 20px;
    bottom: 20px;
  }
}

/* 移动端：底部导航上方居中悬浮 */
@media (max-width: 639px) {
  .ob-card {
    left: 50%;
    bottom: calc(3.5rem + env(safe-area-inset-bottom) + 12px);
    transform: translateX(-50%);
  }
}

.ob-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.ob-card__progress {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
}

.ob-card__close {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #a1a1aa;
  font-size: 16px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
}
.ob-card__close:hover {
  color: #18181b;
  background: #f4f4f5;
}

.ob-card__title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
}

.ob-card__desc {
  margin: 0 0 14px;
  white-space: pre-line;
  color: #3f3f46;
}

.ob-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ob-btn {
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.ob-btn--primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  box-shadow: 0 4px 12px rgb(59 130 246 / 0.3);
}
.ob-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgb(59 130 246 / 0.4);
}

.ob-btn--ghost {
  background: #f4f4f5;
  color: #3f3f46;
}
.ob-btn--ghost:hover {
  background: #e4e4e7;
}

/* 最后一屏的主按钮占满剩余空间 */
.ob-card__actions .ob-btn--primary:last-child {
  flex: 1;
}

.ob-card__skip {
  margin-left: auto;
  color: #a1a1aa;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s;
}
.ob-card__skip:hover {
  color: #52525b;
  text-decoration: underline;
}

/* 出现/消失动画 */
.ob-pop-enter-active,
.ob-pop-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.ob-pop-enter-from,
.ob-pop-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>

<style>
/* 目标元素高亮描边（作用于页面任意位置的引导对象）。
   纯视觉 class，不修改 pointer-events，因此绝不会挡住用户点击。 */
.ob-target {
  outline: 2.5px solid rgb(59 130 246 / 0.8);
  outline-offset: 3px;
  border-radius: 6px;
  animation: ob-pulse 1.8s ease-in-out infinite;
}

@keyframes ob-pulse {
  0%, 100% { outline-color: rgb(59 130 246 / 0.8); }
  50% { outline-color: rgb(59 130 246 / 0.35); }
}
</style>
