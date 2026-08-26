import { config, zh_CN } from 'md-editor-v3'
import { colorViewExtension } from '~/utils/editor/color-decoration'
import { stickerViewExtension } from '~/utils/editor/sticker-decoration'
import { mentionViewExtension } from '~/utils/editor/mention-decoration'

/**
 * 给 md-editor-v3 全局注入所见即所得装饰扩展:
 * - 字体颜色:<span style="color:X"> 标签隐藏、文字直接上色
 * - 表情包:![名字](/stickers/xxx.svg) 语法隐藏、直接显示图片
 * - @提及:[@名](/user/id) 语法隐藏、只显示 @名(蓝),见 utils/editor/mention-decoration.ts
 * md-editor-v3 的 codeMirrorExtensions 是模块级 config 单例,每个编辑器实例创建时
 * 都会调用回调拿到扩展数组;这里追加扩展即可让全站发帖/评论编辑器都生效。
 * 注意:config 用 deepMerge 合并、函数值会被后调用者整个替换,因此所有装饰扩展
 * 必须集中在同一个 config() 调用里,分开文件注册会互相覆盖。
 * .client.ts 保证仅客户端执行(CodeMirror 依赖 DOM)。
 */
export default defineNuxtPlugin(() => {
  config({
    // 工具栏可见名(showToolbarName)微调:默认 zh-CN 名多数够用,只把几个含糊的改清楚。
    // 必须整体展开 zh_CN 再覆写,否则 languageUserDefined 会整块替换该 locale、丢失其它中文文案。
    // 注意:这些名字是 MarkdownEditor.client.vue 里 TOOLBAR_USAGE(「怎么用」hover 提示)的键,改这里需同步。
    editorConfig: {
      languageUserDefined: {
        'zh-CN': {
          ...zh_CN,
          toolbarTips: {
            ...zh_CN.toolbarTips,
            // 名字保持简短(2 字),让发帖工具栏(14 按钮+名字)在窄栏里不横向滚动。
            // 注意:这些名字是 MarkdownEditor.client.vue 里 TOOLBAR_USAGE(「怎么用」hover 提示)的键,改这里需同步。
            unorderedList: '无序',
            orderedList: '有序',
            image: '图片',
            code: '代码块',
            task: '待办',
            fullscreen: '全屏',
          },
        },
      },
    },
    codeMirrorExtensions: (extensions) => [
      ...extensions,
      { type: 'forum-color-wysiwyg', extension: colorViewExtension },
      { type: 'forum-sticker-wysiwyg', extension: stickerViewExtension },
      { type: 'forum-mention-wysiwyg', extension: mentionViewExtension },
    ],
  })
})
