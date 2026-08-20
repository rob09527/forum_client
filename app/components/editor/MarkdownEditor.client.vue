<script setup lang="ts">
import { useId, h, type VNode } from 'vue'
import { MdEditor, type ToolbarNames, type ExposeParam } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import EmojiToolbarButton from './EmojiToolbarButton.vue'
import ColorToolbarButton from './ColorToolbarButton.vue'
import { useUpload } from '~/composables/useUpload'
import { useAuth } from '~/composables/useAuth'
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
// 0 / 1 为自定义工具栏占位(defToolbars 数组对应项):0=表情按钮,1=字体颜色按钮
const TOOLBARS_FULL: ToolbarNames[] = [
  'bold', 'italic', 'strikeThrough', 'title', '-',
  'quote', 'unorderedList', 'orderedList', 'task', '-',
  'link', 'image', 'table', 'codeRow', 'code', '-',
  0, 1, '=', 'preview', 'fullscreen',
]
const TOOLBARS_COMPACT: ToolbarNames[] = [
  'bold', 'italic', 'link', 'codeRow', 'image', 0, 1,
]

const toolbarList = computed<ToolbarNames[]>(() =>
  props.toolbar === 'compact' ? TOOLBARS_COMPACT : TOOLBARS_FULL
)

// 自定义工具栏组件(defToolbars 数组形式,toolbars 里的数字 n 渲染 defToolbars[n] 并注入 insert)
// md-editor-v3 类型声明是 `string | VNode`(单数),但运行时按数组消费——库的类型 bug。
// 这里保持真实类型 `VNode[]`,仅绑定处做一次窄 cast,避免 `any` 扩散到模板。
const defToolbars: VNode[] = [h(EmojiToolbarButton), h(ColorToolbarButton)]
const defToolbarsProp = computed(() => defToolbars as unknown as string)

// ── 图片上传(对接现有 /api/upload) ──
const { isLoggedIn, openLogin } = useAuth()
const toast = useToast()
const { uploadImage } = useUpload()

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
      toast.add({ title: extractErrorMessage(err, '图片上传失败'), color: 'error' })
    }
  }
  callback(urls)
}
</script>

<template>
  <MdEditor
    ref="editorRef"
    v-model="model"
    :editor-id="editorId"
    :theme="theme"
    :toolbars="toolbarList"
    :def-toolbars="defToolbarsProp"
    preview-theme="github"
    :preview="false"
    :placeholder="placeholder"
    :style="{ height: `${height}px`, borderRadius: '0.5rem' }"
    class="rounded-md overflow-hidden"
    @on-upload-img="handleUploadImg"
  />
</template>
