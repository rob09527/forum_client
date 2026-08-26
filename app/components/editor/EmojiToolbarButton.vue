<script setup lang="ts">
import type { Insert } from 'md-editor-v3'
import EmojiPicker from './EmojiPicker.vue'
import { usePopover } from '~/composables/usePopover'

/**
 * md-editor-v3 自定义工具栏按钮:点击弹出 Emoji / 表情包面板。
 * 通过 defToolbars 数组注入,由 md-editor 传入 insert(gen) 以便在编辑器光标处插入。
 */
// defToolbars 注入的 theme/previewTheme/language 等公共属性不应落到按钮 DOM 上
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** md-editor 注入的通用插入方法:insert((selectedText) => InsertParam) */
  insert?: Insert
  disabled?: boolean
  /** md-editor 注入的 showToolbarName,控制图标下方是否显示名称 */
  showToolbarName?: boolean
}>()

// ── 弹出层定位(Teleport 到 body,fixed 相对视口) ──
const PANEL_W = 296 // 18.5rem
const PANEL_H = 330
const popover = usePopover(PANEL_W, PANEL_H)
const { btnRef, show, pos, open, close, toggle } = popover

/** 用户点选表情/表情包 → 在光标处插入 */
function onSelect(text: string) {
  props.insert?.((selectedText) => ({
    targetValue: text,
    select: false,
    // 有选中文本时不覆盖,直接在其后插入
    deviationStart: 0,
    deviationEnd: 0,
  }))
  close()
}
</script>

<template>
  <button
    ref="btnRef"
    type="button"
    class="md-editor-toolbar-item"
    :disabled="disabled"
    title="插入表情 / 表情包：点选后插入光标处"
    aria-label="插入表情"
    @click="toggle"
  >
    <span class="text-base leading-none">😊</span>
    <span v-if="showToolbarName" class="md-editor-toolbar-item-name">表情</span>
  </button>

  <Teleport to="body">
    <!-- 点击空白关闭 -->
    <div v-if="show" class="fixed inset-0 z-[9000]" @click="close"></div>
    <!-- 面板 -->
    <div v-if="show" class="fixed z-[9001]" :style="pos" @click.stop>
      <EmojiPicker @select="onSelect" />
    </div>
  </Teleport>
</template>
