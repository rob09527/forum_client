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

// 首次发帖引导
onMounted(() => {
  if (isLoggedIn.value && !isCompleted('first-post')) {
    // 延迟确保表单已完全渲染
    setTimeout(() => {
      startFirstPostTour()
    }, 800)
  }
})
</script>
