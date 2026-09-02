<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<style>
/* 新手引导样式优化 - 更醒目、更友好 */

/* 高亮元素边框 - 使用动画吸引注意 */
.driver-highlighted-element {
  box-shadow: 0 0 0 4px rgb(59 130 246 / 0.6) !important;
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 4px rgb(59 130 246 / 0.6);
  }
  50% {
    box-shadow: 0 0 0 8px rgb(59 130 246 / 0.4);
  }
}

/* 引导气泡 - 更大、更突出 */
.onboarding-popover {
  max-width: 90vw !important;
  width: 360px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25) !important;
  border: 2px solid rgb(59 130 246 / 0.3) !important;
  animation: popover-appear 0.3s ease-out;
}

@keyframes popover-appear {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 375px) {
  .onboarding-popover {
    width: 300px !important;
  }
}

/* 标题更醒目 */
.onboarding-popover .driver-popover-title {
  font-size: 18px !important;
  font-weight: 700 !important;
  line-height: 1.4 !important;
  color: #18181b !important;
  margin-bottom: 8px !important;
}

/* 描述文字 */
.onboarding-popover .driver-popover-description {
  font-size: 15px !important;
  line-height: 1.7 !important;
  white-space: pre-line !important;
  color: #3f3f46 !important;
}

/* 进度文字更醒目 */
.onboarding-popover .driver-popover-progress-text {
  font-size: 13px !important;
  color: #3b82f6 !important;
  font-weight: 600 !important;
}

/* 按钮更醒目 */
.onboarding-popover .driver-popover-footer-btn {
  font-size: 14px !important;
  font-weight: 500 !important;
  padding: 8px 16px !important;
  border-radius: 6px !important;
  transition: all 0.2s ease !important;
}

/* 下一步按钮高亮 */
.onboarding-popover .driver-popover-footer-btn:last-child {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  color: white !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

.onboarding-popover .driver-popover-footer-btn:last-child:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4) !important;
  transform: translateY(-1px) !important;
}

/* 跳过按钮样式 */
.driver-popover-skip-btn {
  color: #71717a !important;
  font-size: 13px !important;
  transition: all 0.2s ease !important;
}

.driver-popover-skip-btn:hover {
  color: #18181b !important;
  background: rgba(0, 0, 0, 0.05) !important;
  padding: 5px 12px !important;
  border-radius: 4px !important;
}

/* 箭头更醒目 */
.onboarding-popover .driver-popover-arrow {
  border-width: 8px !important;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* 移动端优化 */
@media (max-width: 640px) {
  .onboarding-popover .driver-popover-footer {
    flex-wrap: nowrap !important;
    gap: 10px !important;
  }

  .onboarding-popover .driver-popover-footer button {
    font-size: 13px !important;
    padding: 7px 14px !important;
  }
}
</style>
