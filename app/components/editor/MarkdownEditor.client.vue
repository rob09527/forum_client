<script setup lang="ts">
import { useId, h, type VNode } from 'vue'
import { MdEditor, type ToolbarNames, type ExposeParam } from 'md-editor-v3'
import type { CompletionSource } from '@codemirror/autocomplete'
import DOMPurify from 'isomorphic-dompurify'
import 'md-editor-v3/lib/style.css'
import EmojiToolbarButton from './EmojiToolbarButton.vue'
import ColorToolbarButton from './ColorToolbarButton.vue'
import MoreToolbarButton from './MoreToolbarButton.vue'
import type { MoreCommand } from '~/utils/editor/exec-command'
import { useUpload } from '~/composables/useUpload'
import { useAuth } from '~/composables/useAuth'
import { useQuota } from '~/composables/useQuota'
import { useUserSearch } from '~/composables/useUserSearch'
import { mentionCompletion } from '~/utils/editor/mention-completion'
import { extractErrorMessage } from '~/composables/api'

/**
 * 全站发帖/评论统一 Markdown 编辑器。
 * - .client.vue:只在客户端渲染,避免 md-editor-v3(依赖 DOM/CodeMirror)在 SSR 报错。
 * - 保留 Markdown 纯文本格式,存储/渲染链路与现状一致(marked + DOMPurify)。
 * - 内置完整工具栏(full)/精简工具栏(compact)+ 自定义 Emoji / 表情包按钮。
 * - 图片走现有 POST /api/upload,落库相对路径,与手动插入 `![...]` 一致。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    /** full:发帖; compact:评论(精简工具栏) */
    toolbar?: 'full' | 'compact'
    /** 编辑器高度(px) */
    height?: number
    placeholder?: string
    /** 与站点主题一致,默认浅色 */
    theme?: 'light' | 'dark'
  }>(),
  {
    toolbar: 'full',
    height: 420,
    placeholder: '',
    theme: 'light',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 每个实例独立 editorId(md-editor-v3 SSR 要求常量 id)
const editorId = `md-editor-${useId()}`

const editorRef = ref<ExposeParam>()
const model = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
})

// ── 工具栏预设 ──
// 0 / 1 / 2 为自定义工具栏占位(defToolbars 数组对应项):
//   0=表情按钮, 1=字体颜色(仅发帖), 2=更多(删除线/标题/待办/表格等低频功能收起)
// 高频按钮直铺 + 分组(- 分隔);低频收进「更多」,避免 17 个按钮平铺造成认知负担。
const TOOLBARS_FULL: ToolbarNames[] = [
  'bold', 'italic', '-',
  'quote', 'unorderedList', 'orderedList', '-',
  'link', 'image', 'codeRow', 'code', '-',
  0, 1, 2, '=', 'preview', 'fullscreen',
]
// 评论只保留 图片上传 + 表情包;富文本/颜色不给(评论是轻量表达场景);
// @提及靠打字触发(completions),无需工具栏按钮。
const TOOLBARS_COMPACT: ToolbarNames[] = [
  'image', 0,
]

const toolbarList = computed<ToolbarNames[]>(() =>
  props.toolbar === 'compact' ? TOOLBARS_COMPACT : TOOLBARS_FULL
)

// 自定义工具栏组件(defToolbars 数组形式,toolbars 里的数字 n 渲染 defToolbars[n] 并注入 insert)
// md-editor-v3 类型声明是 `string | VNode`(单数),但运行时按数组消费——库的类型 bug。
// 这里保持真实类型 `VNode[]`,仅绑定处做一次窄 cast,避免 `any` 扩散到模板。
const defToolbars: VNode[] = [h(EmojiToolbarButton), h(ColorToolbarButton), h(MoreToolbarButton)]
const defToolbarsProp = computed(() => defToolbars as unknown as string)

// 向自定义工具栏按钮(更多下拉)提供 execCommand:低频功能直接复用 md-editor 内置命令
// (MoreCommand 是 ToolDirective 的子集,直接传给 execCommand),不手写插入模板。
function runCommand(cmd: MoreCommand) {
  editorRef.value?.execCommand(cmd)
}
provide('md-exec-command', runCommand)

// ── @提及自动补全(官方 completions prop → autocompletion override;setup 内调用 composable 绑定 Nuxt 上下文) ──
const { searchUsers } = useUserSearch()
const completions: CompletionSource[] = [mentionCompletion(searchUsers)]

// ── 图片上传(对接现有 /api/upload) ──
const { isLoggedIn, openLogin } = useAuth()
const toast = useToast()
const { uploadImage } = useUpload()

// ── 上传扩容引导 [1.4.4][3.6]：总量达标 → 弹「扩容 +NMB 需 M🍗」，确认后扩容并重试上传 ──
const { buy: buyQuota, quotaPrice, quotaPerPurchaseMB } = useQuota()
const showQuotaConfirm = ref(false)
const quotaSubmitting = ref(false)
/** 待扩容后重试的整批文件（含回调），扩容成功即重新上传 */
const quotaRetry = ref<{ files: File[]; callback: (urls: string[]) => void } | null>(null)

function isQuotaExceeded(err: unknown): boolean {
  return (err as { data?: { error?: { code?: string } } })?.data?.error?.code === 'UPLOAD_USER_TOTAL_EXCEEDED'
}

async function doBuyQuota() {
  quotaSubmitting.value = true
  try {
    await buyQuota() // 内部按铁律 [3.1] 同步余额
    showQuotaConfirm.value = false
    toast.add({ title: `扩容成功 +${quotaPerPurchaseMB.value}MB（永久额度）`, color: 'success' })
    // 扩容后整批重传（useQuota 已同步余额；fail 时 toast 引导即可）
    const retry = quotaRetry.value
    quotaRetry.value = null
    if (retry) await handleUploadImg(retry.files, retry.callback)
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '扩容失败'), color: 'error' })
  } finally {
    quotaSubmitting.value = false
  }
}

async function handleUploadImg(files: File[], callback: (urls: string[]) => void) {
  if (!isLoggedIn.value) {
    openLogin()
    callback([])
    return
  }
  const urls: string[] = []
  for (const file of files) {
    try {
      // 落库用相对 path,与现状一致(换域名/环境不失效)
      const { path } = await uploadImage(file)
      urls.push(path)
    } catch (err: unknown) {
      // 上传总量达标 → 扩容引导（中断本批，扩容成功后整批重试，不静默丢图）
      if (isQuotaExceeded(err)) {
        quotaRetry.value = { files, callback }
        showQuotaConfirm.value = true
        return
      }
      toast.add({ title: extractErrorMessage(err, '图片上传失败'), color: 'error' })
    }
  }
  callback(urls)
}

// ── 预览消毒与最终渲染一致 ──
// 与 utils/markdown.ts renderMarkdown 相同的 DOMPurify 策略(保留 target 新窗口),
// 让分屏预览里看到的内容安全性和发布后一致。
const sanitizePreview = (html: string) => DOMPurify.sanitize(html, { ADD_ATTR: ['target'] })

// ── 内置工具栏按钮「怎么用」提示 ──
// md-editor 用 toolbarTips 同时渲染按钮可见名 + title。为了可见名保持简短、
// hover 提示能说明「怎么用」,这里在渲染后用 MutationObserver 把 title 换成用法说明。
// 键为 toolbarTips 的默认中文名(配合 md-editor-color.client.ts 里对 image/code/task/fullscreen 的覆写)。
const TOOLBAR_USAGE: Record<string, string> = {
  加粗: '加粗：选中文字后点击，或 Ctrl+B',
  斜体: '斜体：选中文字后点击，或 Ctrl+I',
  删除线: '删除线：选中文字后点击',
  标题: '标题：选中文字后点击设为标题',
  引用: '引用：选中文字后点击设为引用',
  无序: '无序列表：点击插入',
  有序: '有序列表：点击插入',
  待办: '待办清单：点击插入',
  行内代码: '行内代码：选中文字后点击',
  代码块: '代码块：点击插入多行代码',
  链接: '链接：选中文字后点击，输入网址',
  图片: '上传图片：点击选择图片',
  表格: '表格：点击插入表格',
  预览: '预览：查看排版效果',
  全屏: '全屏：切换全屏编辑',
}
let toolbarObserver: MutationObserver | undefined
function setupToolbarHints(attempt = 0) {
  // 作用域到当前实例的工具栏(id = `${editorId}-toolbar-wrapper`,避免同页多个编辑器互相干扰)
  const wrap = document.querySelector<HTMLElement>(`[id="${editorId}-toolbar-wrapper"]`)
  // md-editor 渲染时机可能稍晚,找不到则短间隔重试(上限 1s,避免 v-if 隐藏编辑器时无限轮询)
  if (!wrap) {
    if (attempt < 10) setTimeout(() => setupToolbarHints(attempt + 1), 100)
    return
  }
  const enrich = () => {
    wrap.querySelectorAll<HTMLElement>('.md-editor-toolbar-item').forEach((el) => {
      const label = el.title?.trim()
      const usage = label ? TOOLBAR_USAGE[label] : undefined
      if (usage && el.title !== usage) el.title = usage
    })
  }
  enrich()
  toolbarObserver = new MutationObserver(enrich)
  toolbarObserver.observe(wrap, { childList: true, subtree: true })
}
onMounted(() => setupToolbarHints())
onBeforeUnmount(() => toolbarObserver?.disconnect())
</script>

<template>
  <MdEditor
    ref="editorRef"
    v-model="model"
    :editor-id="editorId"
    :theme="theme"
    :toolbars="toolbarList"
    :def-toolbars="defToolbarsProp"
    :completions="completions"
    preview-theme="github"
    :preview="false"
    :show-toolbar-name="true"
    :sanitize="sanitizePreview"
    :placeholder="placeholder"
    :style="{ height: `${height}px`, borderRadius: '0.5rem' }"
    class="rounded-md overflow-hidden"
    @on-upload-img="handleUploadImg"
  />

  <!-- 上传扩容引导（统一弹窗封装）[1.4.4][3.6]：Teleport 到 body，不影响编辑器布局 -->
  <ConfirmModal
    v-model="showQuotaConfirm"
    title="上传空间已满"
    :message="`当前上传总量已达上限。扩容 +${quotaPerPurchaseMB}MB 需消耗 ${quotaPrice}🍗（永久额度），扩容后可继续上传。确定扩容吗？`"
    confirm-text="扩容并重试"
    :loading="quotaSubmitting"
    @confirm="doBuyQuota"
  />
</template>
