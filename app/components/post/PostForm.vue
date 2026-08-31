<template>
  <div class="panel p-4 sm:p-6 pb-24 lg:pb-6">
    <h1 class="text-lg font-semibold text-zinc-900 mb-5">{{ isEdit ? '编辑帖子' : '发布新帖' }}</h1>

    <div class="space-y-4 sm:space-y-5">
      <!-- 标题 -->
      <div data-onboarding="post-title">
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
        <div data-onboarding="post-category">
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
        <div data-onboarding="post-tags">
          <label class="block text-sm text-zinc-600 mb-1.5">标签（最多 5 个，点击推荐添加）</label>
          <div class="flex flex-wrap items-center gap-1.5 bg-white border border-zinc-200 rounded-md px-2 py-1.5 min-h-[2.4rem]">
            <span
              v-for="tag in tags"
              :key="tag"
              class="inline-flex items-center gap-1 bg-blue-500/15 text-blue-600 text-xs px-2 py-0.5 rounded"
            >
              {{ tag }}
              <button type="button" class="hover:text-blue-500 p-0.5" aria-label="移除标签" @click="removeTag(tag)"><AppIcon name="x" :size="11" /></button>
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

      <!-- 悬赏问答 [1.6.4][3.5]：发布时托管扣款 → 采纳后发给回答者 → 超时自动判给最高赞。
           仅发帖可设（编辑不可改，避免改动既有悬赏帖金额破坏账务一致性） -->
      <div v-if="!isEdit" class="bg-amber-500/5 border border-amber-500/20 rounded-md px-4 py-3">
        <!-- 窄屏(≤~350px)三元素放不下时会换行：flex-wrap 让描述文字折行不溢出/不错位 -->
        <label class="flex items-center gap-x-2 gap-y-1 flex-wrap cursor-pointer select-none">
          <input v-model="bountyEnabled" type="checkbox" class="accent-amber-500 w-4 h-4" />
          <span class="text-sm text-zinc-700">设为悬赏帖</span>
          <span class="text-xs text-zinc-500">让优质回答赢走你的鸡腿</span>
        </label>

        <!-- 金额 + 余额 + 前端即时校验（后端 service 还会按 config:bounty 复检） -->
        <div v-if="bountyEnabled" class="mt-3 flex items-center gap-3 flex-wrap">
          <input
            v-model.number="bountyAmount"
            type="number"
            step="1"
            :min="bountyConfig.amountMin"
            :max="bountyConfig.amountMax"
            class="w-32 bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-sm text-zinc-800 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
            placeholder="金额"
          />
          <span class="text-sm text-zinc-600">🍗 <span class="font-mono tabular-nums">{{ balance }}</span> 可用</span>
          <span v-if="bountyError" class="text-xs text-red-600">{{ bountyError }}</span>
        </div>
        <!-- 产品 1.6.4 硬性要求：最后一句必须前置告知（紧迫感 + 避免结算争议） -->
        <p v-if="bountyEnabled" class="text-xs text-zinc-500 mt-2 leading-5 inline-flex items-start gap-1">
          <AppIcon name="info" :size="13" class="mt-0.5 shrink-0" /> 发布后立即扣除。采纳答案后发放给回答者；
          {{ bountyConfig.timeoutDays }} 天内未采纳，将自动判给最高赞回答。
        </p>
      </div>

      <!-- 正文（完整 Markdown 编辑器：工具栏 + 图片上传 + 表情；hover 按钮可看用法，右上角可预览） -->
      <div data-onboarding="post-editor">
        <label class="block text-sm text-zinc-600 mb-1.5">正文</label>
        <div data-onboarding="editor-toolbar">
        <MarkdownEditor
          v-model="content"
          toolbar="full"
          :height="editorHeight"
          placeholder="用 Markdown 撰写正文：支持加粗、列表、图片、表情等。鼠标悬停工具栏按钮可查看用法，右上角可预览排版"
        />
        </div>
        <p class="text-xs mt-1 text-right" :class="content.trim().length < 10 ? 'text-amber-600/90' : 'text-zinc-600'">
          {{ content.length }} 字符<span v-if="content.trim().length < 10"> · 至少 10 字</span>
        </p>
      </div>

      <!-- 错误提示 -->
      <div
        v-if="error"
        class="text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 flex items-center gap-1.5"
      >
        <AppIcon name="alert-triangle" :size="14" class="shrink-0" /> {{ error }}
      </div>

      <!-- 操作按钮 - 移动端固定在底部，避让底部导航栏 -->
      <div class="lg:flex lg:items-center lg:gap-3 lg:pt-1 fixed lg:static bottom-14 lg:bottom-0 left-0 right-0 bg-white border-t lg:border-t-0 border-zinc-200 p-4 lg:p-0 flex items-center gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] lg:shadow-none z-30 lg:z-auto">
        <button
          type="button"
          data-onboarding="post-submit"
          class="flex-1 lg:flex-none btn btn-primary px-5 py-2.5 lg:py-2 text-sm font-medium"
          :disabled="submitting"
          @click="submit"
        >
          {{ submitting ? '提交中…' : (isEdit ? '保存修改' : '发布') }}
        </button>
        <NuxtLink
          :to="isEdit && post ? `/post/${post.id}` : '/'"
          class="flex-1 lg:flex-none text-center lg:text-left py-2.5 lg:py-0 text-sm text-zinc-600 hover:text-zinc-900 border lg:border-0 border-zinc-200 rounded-md lg:rounded-none"
        >
          取消
        </NuxtLink>
      </div>
    </div>

    <!-- 移动端底部占位，防止内容被固定按钮和底部导航遮挡 -->
    <div class="h-32 lg:hidden"></div>
  </div>
</template>

<script setup lang="ts">
import type { PostDetail } from '~/types'
import { usePosts } from '~/composables/usePosts'
import { useGameConfig } from '~/composables/useGameConfig'
import { usePoints } from '~/composables/usePoints'
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
const { bountyConfig } = useGameConfig()
const { balance } = usePoints()

const isEdit = computed(() => !!props.post)

// ── 响应式编辑器高度：手机端动态计算，确保内容可见 ──
const editorHeight = ref(440)

onMounted(() => {
  updateEditorHeight()
  window.addEventListener('resize', updateEditorHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateEditorHeight)
})

function updateEditorHeight() {
  if (typeof window === 'undefined') return

  const isMobile = window.innerWidth < 1024 // lg 断点
  if (isMobile) {
    // 移动端：视口高度 - 预留空间
    // 视口 - 顶栏(64) - 标题(40) - 表单字段(约300) - 固定底栏(72) - 缓冲(60)
    const viewportHeight = window.innerHeight
    const reservedSpace = 536
    const calculatedHeight = Math.max(200, Math.min(350, viewportHeight - reservedSpace))
    editorHeight.value = calculatedHeight
  } else {
    // 桌面端：保持原有高度
    editorHeight.value = 440
  }
}

// ── 表单状态 ──
const title = ref(props.post?.title ?? '')
const category = ref(props.post?.category ?? '')
const content = ref(props.post?.content ?? '')
const tags = ref<string[]>([...(props.post?.tags ?? [])])
const submitting = ref(false)
const error = ref('')

// ── 悬赏问答 [1.6.4][3.5]：开关 + 金额；前端即时校验（金额区间/余额），后端按 config:bounty 复检 ──
const bountyEnabled = ref(false)
const bountyAmount = ref<number | null>(null)
const bountyError = computed(() => {
  if (!bountyEnabled.value) return ''
  const n = bountyAmount.value
  if (n == null || !Number.isFinite(n)) {
    return `请输入悬赏金额（${bountyConfig.value.amountMin}~${bountyConfig.value.amountMax}🍗）`
  }
  if (n < bountyConfig.value.amountMin) return `最少 ${bountyConfig.value.amountMin}🍗`
  if (n > bountyConfig.value.amountMax) return `最多 ${bountyConfig.value.amountMax}🍗`
  if (n > balance.value) return `余额不足，还差 ${n - balance.value}🍗`
  return ''
})

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
  if (bountyEnabled.value && bountyError.value) {
    error.value = bountyError.value
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
      // 悬赏开关打开且金额合法 → 随 PostInput 传 bountyAmount（后端托管扣款建 Bounty）[3.5]
      ...(bountyEnabled.value && bountyAmount.value
        ? { bountyAmount: Math.floor(bountyAmount.value) }
        : {}),
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
