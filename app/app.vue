<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<style>
/* 新手引导样式优化 - 适配移动端小屏幕 */

/* 🔧 修复黑色遮罩问题：改为白色半透明，更柔和 */
.driver-overlay {
  background-color: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(2px) !important;
}

/* 高亮区域边框优化 */
.driver-highlighted-element {
  box-shadow: 0 0 0 4px rgb(59 130 246 / 0.5) !important;
}

.onboarding-popover {
  max-width: 90vw !important;
  width: 320px !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
}

@media (max-width: 375px) {
  .onboarding-popover {
    width: 280px !important;
  }
}

.onboarding-popover .driver-popover-title {
  font-size: 16px !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  color: #18181b !important;
}

.onboarding-popover .driver-popover-description {
  font-size: 14px !important;
  line-height: 1.6 !important;
  white-space: pre-line !important;
  color: #52525b !important;
}

.onboarding-popover .driver-popover-progress-text {
  font-size: 12px !important;
  color: #71717a !important;
  font-weight: 500 !important;
}

/* 跳过按钮样式增强 */
.driver-popover-skip-btn:hover {
  color: #18181b !important;
}

/* 移动端按钮优化 */
@media (max-width: 640px) {
  .onboarding-popover .driver-popover-footer {
    flex-wrap: nowrap !important;
    gap: 8px !important;
  }

  .onboarding-popover .driver-popover-footer button {
    font-size: 13px !important;
    padding: 6px 12px !important;
  }
}
</style>
