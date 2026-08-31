<script setup lang="ts">
import type { Insert } from 'md-editor-v3'
import { usePopover } from '~/composables/usePopover'

/**
 * md-editor-v3 自定义工具栏按钮:选中文字 → 弹色板 → 包成 <span style="color:...">。
 * Markdown 无原生颜色语法,用内联 HTML 实现;渲染链路(marked + DOMPurify)会保留 color。
 * defToolbars 注入的 theme/previewTheme/language 等公共属性不应落到按钮 DOM 上。
 */
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** md-editor 注入的通用插入方法:insert((selectedText) => InsertParam) */
  insert?: Insert
  disabled?: boolean
  /** md-editor 注入的 showToolbarName,控制图标下方是否显示名称 */
  showToolbarName?: boolean
}>()

/** 预置色板(12 常用色),来自设计系统常用色,均可安全用于 style */
const PRESET_COLORS = [
  { name: '红', value: '#e53935' },
  { name: '橙', value: '#fb8c00' },
  { name: '黄', value: '#fdd835' },
  { name: '绿', value: '#43a047' },
  { name: '青', value: '#00acc1' },
  { name: '蓝', value: '#1e88e5' },
  { name: '紫', value: '#8e24aa' },
  { name: '粉', value: '#ec407a' },
  { name: '棕', value: '#795548' },
  { name: '灰', value: '#616161' },
  { name: '黑', value: '#212121' },
  { name: '白', value: '#ffffff' },
]

// ── 弹出层定位(Teleport 到 body,fixed 相对视口) ──
const PANEL_W = 264 // 6 列 × 44px 色块 + 内边距
const PANEL_H = 132
const popover = usePopover(PANEL_W, PANEL_H)
const { btnRef, show, pos, open, close, toggle } = popover

/** 选中文字包上颜色;无选中时插入空 span 并把光标放内部,继续打字即带色 */
function onSelect(color: string) {
  props.insert?.((selectedText) => {
    const open = `<span style="color:${color}">`
    const close = '</span>'
    if (selectedText) {
      return { targetValue: open + selectedText + close, select: false, deviationStart: 0, deviationEnd: 0 }
    }
    // 光标折叠到 <span>…</span> 内部
    const targetValue = open + close
    const cursor = open.length
    return { targetValue, select: true, deviationStart: cursor, deviationEnd: cursor - targetValue.length }
  })
  close()
}
</script>

<template>
  <button
    ref="btnRef"
    type="button"
    class="md-editor-toolbar-item"
    :disabled="disabled"
    title="字体颜色：选中文字后点击上色"
    aria-label="字体颜色"
    @click="toggle"
  >
    <span class="text-base leading-none font-semibold text-red-600" aria-hidden="true">A
      <span class="block h-0.5 w-3.5 bg-current mx-auto mt-0.5"></span>
    </span>
    <span v-if="showToolbarName" class="md-editor-toolbar-item-name">颜色</span>
  </button>

  <Teleport to="body">
    <!-- 点击空白关闭 -->
    <div v-if="show" class="fixed inset-0 z-[9000]" @click="close"></div>
    <!-- 色板 -->
    <div v-if="show" class="fixed z-[9001]" :style="pos" @click.stop>
      <div class="bg-white rounded-lg shadow-lg border border-zinc-200 p-2">
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          <button
            v-for="c in PRESET_COLORS"
            :key="c.value"
            type="button"
            :title="c.name"
            class="w-8 h-8 rounded-md border border-zinc-200 hover:scale-110 transition-transform"
            :style="{ backgroundColor: c.value }"
            @click="onSelect(c.value)"
          ></button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
