<template>
  <div class="panel p-6">
    <h1 class="text-lg font-semibold text-zinc-900 mb-5">{{ isEdit ? '编辑帖子' : '发布新帖' }}</h1>

    <div class="space-y-5">
      <!-- 标题 -->
      <div>
        <label class="block text-sm text-zinc-600 mb-1.5">标题</label>
        <input
          v-model="title"
          type="text"
          maxlength="200"
          placeholder="一句话说清楚你要分享的内容"
          class="w-full bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-800 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30"
        />
        <p class="text-xs text-zinc-600 mt-1 text-right">{{ title.length }}/200</p>
      </div>

      <!-- 板块 + 标签 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm text-zinc-600 mb-1.5">板块</label>
          <select
            v-model="category"
            class="w-full bg-white border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:border-blue-500/60"
          >
            <option disabled value="">请选择板块</option>
            <!-- 原生 option 无法渲染 SVG 图标，只显示板块名 -->
            <option v-for="c in categories" :key="c.slug" :value="c.slug">
              {{ c.name }}
            </option>
          </select>
        </div>

        <!-- 标签（系统自动推荐，点击添加） -->
        <div>
          <label class="block text-sm text-zinc-600 mb-1.5">标签（最多 5 个，点击推荐添加）</label>
          <div class="flex flex-wrap items-center gap-1.5 bg-white border border-zinc-200 rounded-md px-2 py-1.5 min-h-[2.4rem]">
            <span
              v-for="tag in tags"
              :key="tag"
              class="inline-flex items-center gap-1 bg-blue-500/15 text-blue-600 text-xs px-2 py-0.5 rounded"
            >
              {{ tag }}
              <button type="button" class="hover:text-blue-500" @click="removeTag(tag)">×</button>
            </span>
            <span v-if="tags.length === 0" class="text-xs text-zinc-600">撰写正文后自动推荐标签</span>
          </div>
          <p v-if="tags.length >= 5" class="text-xs text-amber-600/80 mt-1">最多 5 个标签</p>
          <!-- 推荐标签：标题+正文自动匹配，点击即添加 -->
          <div v-if="tagRecommendations.length > 0" class="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span class="text-[11px] text-zinc-600">推荐：</span>
            <button
              v-for="r in tagRecommendations"
              :key="r"
              type="button"
              class="text-xs px-2 py-0.5 rounded-full bg-white text-zinc-600 hover:bg-blue-500/15 hover:text-blue-700 border border-zinc-200 hover:border-blue-500/30 transition-colors"
              @click="addRecommendation(r)"
            >
              {{ r }}
            </button>
          </div>
        </div>
      </div>

      <!-- 正文 -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-sm text-zinc-600">正文（支持 Markdown）</label>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="text-xs px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              :disabled="uploading"
              @click="triggerUpload"
            >
              {{ uploading ? '上传中…' : '🖼 插入图片' }}
            </button>
            <button
              type="button"
              class="text-xs px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              @click="preview = !preview"
            >
              {{ preview ? '编辑' : '👁 预览' }}
            </button>
          </div>
        </div>

        <input ref="fileInputRef" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="handleFile" />

        <textarea
          v-if="!preview"
          v-model="content"
          rows="14"
          placeholder="分享你的内容，支持 Markdown 语法、图片…"
          class="w-full bg-white border border-zinc-200 rounded-md px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 font-mono resize-y"
        ></textarea>

        <!-- 预览 -->
        <div
          v-else
          class="w-full bg-white border border-zinc-200 rounded-md px-4 py-3 text-sm text-zinc-700 min-h-[16rem] markdown-body"
          v-html="content ? renderMarkdown(content) : '<span class=text-zinc-600>预览区域</span>'"
        ></div>

        <p class="text-xs text-zinc-600 mt-1">{{ content.length }} 字符</p>
      </div>

      <!-- 错误提示 -->
      <div
        v-if="error"
        class="text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2"
      >
        ⚠️ {{ error }}
      </div>

      <!-- 操作 -->
      <div class="flex items-center gap-3 pt-1">
        <button
          type="button"
          class="px-5 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-md transition-colors"
          :disabled="submitting"
          @click="submit"
        >
          {{ submitting ? '提交中…' : (isEdit ? '保存修改' : '发布') }}
        </button>
        <NuxtLink :to="isEdit && post ? `/post/${post.id}` : '/'" class="text-sm text-zinc-600 hover:text-zinc-900">
          取消
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PostDetail } from '~/types'
import { renderMarkdown } from '~/utils/markdown'
import { usePosts } from '~/composables/usePosts'
import { useUpload } from '~/composables/useUpload'
import { extractErrorMessage } from '~/composables/api'
import { subTags as fallbackTags } from '~/constants/categories'

/** 编辑模式传入的帖子数据；创建模式传 null */
const props = defineProps<{ post?: PostDetail | null }>()

const emit = defineEmits<{
  /** 提交成功，返回创建/编辑后的帖子 */
  success: [post: PostDetail]
}>()

const { categories, tags: allTags } = useCategories()
/** 确保始终有可用数据：优先 API，兜底常量（fallbackTags 从顶部 import） */
const tagPool = computed<string[]>(() => {
  return (allTags.value && allTags.value.length > 0) ? allTags.value : fallbackTags
})
const { isLoggedIn, openLogin } = useAuth()
const { createPost, updatePost } = usePosts()
const { uploading, error: uploadError, uploadImage } = useUpload()

const isEdit = computed(() => !!props.post)

// ── 表单状态 ──
const title = ref(props.post?.title ?? '')
const category = ref(props.post?.category ?? '')
const content = ref(props.post?.content ?? '')
const tags = ref<string[]>([...(props.post?.tags ?? [])])
const fileInputRef = ref<HTMLInputElement | null>(null)
const preview = ref(false)
const submitting = ref(false)
const error = ref('')

// ── 标签操作 ──
function removeTag(tag: string) {
  tags.value = tags.value.filter((t) => t !== tag)
}

/** 点击推荐标签直接加入 */
function addRecommendation(tag: string) {
  if (tags.value.length < 5 && !tags.value.includes(tag)) {
    tags.value.push(tag)
  }
}

/**
 * 推荐标签：从标题+正文中自动匹配标签池中的标签。
 * - 长标签优先（"扣子平台" > "扣子"，更精准）
 * - 文本短于 10 字符不触发（减少噪音）
 * - 最多 5 个，去重已选标签
 */
const tagRecommendations = computed(() => {
  if (tags.value.length >= 5) return []
  const text = (title.value + ' ' + content.value).toLowerCase()
  if (text.length < 10) return []
  const pool = tagPool.value
  if (!pool || pool.length === 0) return []
  const selected = new Set(tags.value.map(t => t.toLowerCase()))
  return pool
    .filter(t => {
      const lower = t.toLowerCase()
      if (lower.length < 2 || lower.length > 20 || selected.has(lower)) return false
      // 1. 标签完整出现在正文中
      if (text.includes(lower)) return true
      // 2. 复合标签拆词匹配（"AI Agent" → "agent" 命中）
      const words = lower.split(/[\s\-/]+/).filter(w => w.length >= 2)
      if (words.some(w => text.includes(w))) return true
      // 3. 中文组合标签双字滑动匹配（"扣子平台" → "扣子" 命中）
      for (let i = 0; i < lower.length - 1; i++) {
        if (text.includes(lower.slice(i, i + 2))) return true
      }
      return false
    })
    .sort((a, b) => b.length - a.length)
    .slice(0, 5)
})

// ── 图片上传 ──
function triggerUpload() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  fileInputRef.value?.click()
}

async function handleFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允许连续选择同一文件
  if (!file) return
  try {
    const { path } = await uploadImage(file)
    // 插入 Markdown 图片语法（相对路径：换域名/换环境图片不失效，渲染时走同源反代解析）
    content.value += `\n![图片](${path})\n`
  } catch (err: any) {
    error.value = err?.message || '图片上传失败'
  }
}

// ── 提交 ──
async function submit() {
  error.value = ''

  // 前端基础校验（后端还会再做一次完整校验）
  if (!title.value.trim()) {
    error.value = '标题不能为空'
    return
  }
  if (title.value.length > 200) {
    error.value = '标题最多 200 个字符'
    return
  }
  if (!category.value) {
    error.value = '请选择板块'
    return
  }
  if (content.value.trim().length < 10) {
    error.value = '正文至少 10 个字符'
    return
  }

  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  // 用户未手动选择标签时，自动取推荐列表第一个
  if (tags.value.length === 0 && tagRecommendations.value.length > 0) {
    const first = tagRecommendations.value[0]
    if (first) tags.value.push(first)
  }

  submitting.value = true
  try {
    const input = {
      title: title.value.trim(),
      content: content.value.trim(),
      category: category.value,
      tags: tags.value,
    }
    const post = props.post
      ? await updatePost(props.post.id, input)
      : await createPost(input)
    emit('success', post)
  } catch (err: any) {
    error.value = extractErrorMessage(err, '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>
