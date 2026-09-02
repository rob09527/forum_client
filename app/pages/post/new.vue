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

// 首次发帖引导 - 改为被动触发：用户开始编辑后 2 秒触发
onMounted(() => {
  if (isLoggedIn.value && !isCompleted('first-post')) {
    // 等待用户开始输入标题
    const checkForInput = () => {
      const titleInput = document.querySelector('[data-onboarding="post-title"]') as HTMLInputElement
      if (titleInput) {
        let inputTimer: ReturnType<typeof setTimeout> | null = null

        const handleInput = () => {
          // 用户开始输入后，等待 2 秒再触发引导
          if (inputTimer) clearTimeout(inputTimer)
          inputTimer = setTimeout(() => {
            if (!isCompleted('first-post')) {
              startFirstPostTour()
            }
          }, 2000)

          // 只触发一次
          titleInput.removeEventListener('focus', handleInput)
          titleInput.removeEventListener('input', handleInput)
        }

        titleInput.addEventListener('focus', handleInput)
        titleInput.addEventListener('input', handleInput)
      }
    }

    // 延迟确保表单已完全渲染
    setTimeout(checkForInput, 500)
  }
})
</script>
