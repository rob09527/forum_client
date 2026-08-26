<script setup lang="ts">
import { usePopover } from '~/composables/usePopover'
import type { MoreCommand } from '~/utils/editor/exec-command'

/**
 * md-editor-v3 自定义工具栏按钮:低频富文本功能(删除线/标题/待办/表格)收进「更多」下拉,
 * 避免发帖工具栏 17 个按钮平铺。点击某项 → inject MarkdownEditor 提供的 execCommand,
 * 直接复用 md-editor 内置命令(MoreCommand ⊂ ToolDirective),与内置按钮行为完全一致。
 */
// defToolbars 注入的 theme/previewTheme/language/codeTheme 等公共属性不应落到按钮 DOM 上
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** md-editor 注入的 showToolbarName,控制图标下方是否显示名称 */
  showToolbarName?: boolean
  disabled?: boolean
}>()

// 由 MarkdownEditor wrapper provide(组件树内总是可用;兜底空函数避免注入失败)
const execCommand = inject<(cmd: MoreCommand) => void>('md-exec-command', () => {})

// ── 弹出层定位(Teleport 到 body,fixed 相对视口) ──
const PANEL_W = 168
const PANEL_H = 220
const popover = usePopover(PANEL_W, PANEL_H)
const { btnRef, show, pos, open, close, toggle } = popover

/** 低频功能清单:全部走 md-editor 内置命令 */
const ITEMS: { cmd: MoreCommand; label: string }[] = [
  { cmd: 'strikeThrough', label: '删除线' },
  { cmd: 'h1', label: '标题 1' },
  { cmd: 'h2', label: '标题 2' },
  { cmd: 'h3', label: '标题 3' },
  { cmd: 'task', label: '待办清单' },
  { cmd: 'table', label: '表格' },
]

function onPick(cmd: MoreCommand) {
  execCommand(cmd)
  close()
}
</script>

<template>
  <button
    ref="btnRef"
    type="button"
    class="md-editor-toolbar-item"
    :disabled="disabled"
    title="更多格式：删除线、标题、待办、表格"
    aria-label="更多格式"
    @click="toggle"
  >
    <span class="text-base leading-none font-semibold tracking-widest" aria-hidden="true">⋯</span>
    <span v-if="showToolbarName" class="md-editor-toolbar-item-name">更多</span>
  </button>

  <Teleport to="body">
    <!-- 点击空白关闭 -->
    <div v-if="show" class="fixed inset-0 z-[9000]" @click="close"></div>
    <!-- 下拉列表 -->
    <div v-if="show" class="fixed z-[9001]" :style="pos" @click.stop>
      <div class="bg-white rounded-lg shadow-lg border border-zinc-200 py-1.5">
        <button
          v-for="it in ITEMS"
          :key="it.cmd"
          type="button"
          class="w-full text-left text-sm text-zinc-700 hover:bg-blue-500/10 hover:text-blue-700 px-3 py-1.5 transition-colors"
          @click="onPick(it.cmd)"
        >
          {{ it.label }}
        </button>
      </div>
    </div>
  </Teleport>
</template>
