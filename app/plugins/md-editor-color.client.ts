import { config } from 'md-editor-v3'
import { colorViewExtension } from '~/utils/editor/color-decoration'
import { stickerViewExtension } from '~/utils/editor/sticker-decoration'

/**
 * 给 md-editor-v3 全局注入所见即所得装饰扩展:
 * - 字体颜色:<span style="color:X"> 标签隐藏、文字直接上色
 * - 表情包:![名字](/stickers/xxx.svg) 语法隐藏、直接显示图片
 * md-editor-v3 的 codeMirrorExtensions 是模块级 config 单例,每个编辑器实例创建时
 * 都会调用回调拿到扩展数组;这里追加扩展即可让全站发帖/评论编辑器都生效。
 * .client.ts 保证仅客户端执行(CodeMirror 依赖 DOM)。
 */
export default defineNuxtPlugin(() => {
  config({
    codeMirrorExtensions: (extensions) => [
      ...extensions,
      { type: 'forum-color-wysiwyg', extension: colorViewExtension },
      { type: 'forum-sticker-wysiwyg', extension: stickerViewExtension },
    ],
  })
})
