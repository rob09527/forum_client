<template>
  <div class="max-w-3xl mx-auto">
    <PostForm @success="onSuccess" />
  </div>
</template>

<script setup lang="ts">
import type { PostDetail } from '~/types'

const router = useRouter()
const toast = useToast()
const { startFirstPostTour, isCompleted } = useOnboarding()

/** 发布成功 → 跳转到帖子详情页 */
function onSuccess(post: PostDetail) {
  toast.add({ title: '发布成功', color: 'success' })
  router.push(`/post/${post.id}`)
}

// 未登录用户打开发帖页时，提示登录
const { isLoggedIn, isRestoring, openLogin } = useAuth()
if (import.meta.client) {
  watchEffect(() => {
    if (!isRestoring.value && !isLoggedIn.value) {
      openLogin()
    }
  })
}

// 首次发帖引导：进页面后延迟显示非模态引导卡片（不打断编辑，用户可随时关）。
// 定时器存句柄并在卸载时清理——否则用户在延迟内离开发帖页，卡片会在别的页面弹出。
/** first-post 引导弹出延迟（毫秒）：等编辑器挂载稳定后再提示 */
const FIRST_POST_TOUR_DELAY_MS = 1200
let firstPostTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  if (isLoggedIn.value && !isCompleted('first-post')) {
    firstPostTimer = setTimeout(() => {
      firstPostTimer = undefined
      startFirstPostTour()
    }, FIRST_POST_TOUR_DELAY_MS)
  }
})
onBeforeUnmount(() => {
  if (firstPostTimer) clearTimeout(firstPostTimer)
  firstPostTimer = undefined
})
</script>
