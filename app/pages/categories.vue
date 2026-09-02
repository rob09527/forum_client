<template>
  <div class="space-y-4">
    <!-- tips 轮播 -->
    <TipsBanner />

    <!-- 页面标题：手机端隐藏，PC端显示 -->
    <div class="hidden lg:block px-1">
      <h1 class="text-xl font-semibold text-zinc-900">所有分类</h1>
    </div>

    <!-- 分类网格（移动端 2 列，平板 3 列，桌面 4 列） -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <button
        v-for="cat in categories"
        :key="cat.slug"
        class="panel p-4 flex flex-col items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95"
        @click="handleSelectCategory(cat.slug)"
      >
        <!-- 图标容器 -->
        <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <CategoryIcon :name="cat.icon" class="w-8 h-8 text-blue-600" />
        </div>

        <!-- 分类名称 -->
        <div class="text-center space-y-1">
          <div class="text-sm font-medium text-zinc-900">{{ cat.name }}</div>
          <div class="text-xs text-zinc-400 font-mono">{{ cat.postCount }} 帖</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { categories } = useCategories()

/** 选择分类：跳转到首页并按 slug 过滤（general=综合讨论是真实分类，与「全部」无关，一律带参数） */
function handleSelectCategory(slug: string) {
  router.push({ path: '/', query: { category: slug } })
}

// SEO 元数据
useHead({
  title: '所有分类 - Forum 论坛',
  meta: [
    { name: 'description', content: '浏览 Forum 论坛的所有分类板块，选择你感兴趣的话题' }
  ]
})
</script>
