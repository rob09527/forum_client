<template>
  <div class="max-w-3xl mx-auto">
    <!-- 帖子加载失败 / 不存在 -->
    <div v-if="loadError" class="panel p-6 text-center">
      <p class="text-red-600 text-sm mb-3">帖子不存在或已被删除</p>
      <NuxtLink to="/" class="text-sm text-blue-600 hover:text-blue-500">返回首页</NuxtLink>
    </div>

    <!-- 非作者访问 -->
    <div v-else-if="accessError" class="panel p-6 text-center">
      <p class="text-red-600 text-sm mb-3">{{ accessError }}</p>
      <NuxtLink :to="`/post/${route.params.id}`" class="text-sm text-blue-600 hover:text-blue-500">返回帖子</NuxtLink>
    </div>

    <!-- 编辑表单（SSR 也有内容；作者校验在客户端登录态恢复后生效） -->
    <PostForm v-else-if="post" :post="post" @success="onSuccess" />
  </div>
</template>

<script setup lang="ts">
import type { PostDetail } from '~/types'
import { usePosts } from '~/composables/usePosts'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user, isLoggedIn, isRestoring } = useAuth()
const { getPost } = usePosts()

const postId = Number(route.params.id)
// 非法/越界 id 直接视为不存在（跳过 /api/posts/NaN 无效请求）
const postIdValid = Number.isInteger(postId) && postId > 0

// SSR 即拉取帖子，首屏直接出表单。
// 401（未登录）返回 null 交给 accessError 展示「请先登录」，避免误报「帖子不存在或已被删除」；
// 其余错误（404/500/网络）才走 loadError
const { data: post, error: loadError, refresh } = useAsyncData<PostDetail | null>(
  `post-edit-${postId}`,
  async () => {
    if (!postIdValid) return null
    try {
      return await getPost(postId)
    } catch (err: any) {
      if (err?.status === 401) return null
      throw err
    }
  }
)

// 作者校验依赖登录态（客户端恢复 session 后生效）。
// accessError 有赋值也有清除：登录态/帖子变化后重新判定，作者不会再被旧的错误文案卡住
const accessError = ref('')
watchEffect(() => {
  // 客户端 session 恢复完成前先不判，避免把「加载中」误判成「未登录」
  if (isRestoring.value) return
  // 未登录：不能看到编辑表单（原逻辑 user.value 为 null 时短路，导致表单泄漏给未登录用户）
  if (!user.value) {
    accessError.value = '请先登录后再编辑'
    return
  }
  if (post.value && user.value.id !== post.value.author.id) {
    accessError.value = '只有作者本人可以编辑这篇帖子'
    return
  }
  accessError.value = ''
})

// 登录成功且此前因 401 未拉到帖子 → 补拉，作者登录后直接进入表单
watch(isLoggedIn, (v) => {
  if (v && !post.value && !loadError.value) refresh()
})

function onSuccess(updated: PostDetail) {
  toast.add({ title: '修改已保存', color: 'success' })
  router.push(`/post/${updated.id}`)
}
</script>
