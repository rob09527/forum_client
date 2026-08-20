import { RangeSetBuilder, RangeSet, type Extension } from '@codemirror/state'
import { Decoration, type DecorationSet, ViewPlugin, EditorView, type ViewUpdate, WidgetType } from '@codemirror/view'

/**
 * 表情包所见即所得装饰:把 ![名字](/stickers/xxx.svg) 的 Markdown 图片语法
 * 在编辑区直接显示成图片(隐藏语法文本,替换为 <img> widget)。
 *
 * 与颜色装饰同思路:文档仍是 Markdown 纯文本,只是显示层替换。
 * 只匹配 /stickers/ 路径,普通上传图片的 ![...](url) 保持原样可编辑。
 */
// src 段只收文件名白名单字符(与 public/stickers/ 下真实文件名一致,如 zan.svg / 100.svg)
const STICKER_RE = /!\[[^\]]*\]\(\/stickers\/[a-zA-Z0-9._-]+\)/g
// 从匹配文本里解析出 src(stickerUrl 返回 /stickers/xxx.svg)
const SRC_RE = /\]\((\/stickers\/[a-zA-Z0-9._-]+)\)/

/** 渲染 sticker 图片的 widget */
class StickerImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string
  ) {
    super()
  }

  override eq(other: StickerImageWidget): boolean {
    return other.src === this.src && other.alt === this.alt
  }

  override toDOM(): HTMLElement {
    const img = document.createElement('img')
    img.src = this.src
    img.alt = this.alt
    img.draggable = false
    img.className = 'md-editor-sticker'
    img.style.height = '1.4em'
    img.style.verticalAlign = 'middle'
    img.style.display = 'inline-block'
    img.style.margin = '0 2px' // 与 main.css 的 .markdown-body img[src^="/stickers/"] 一致,改尺寸时同步两处
    // 加载失败(文件被删等)时显示占位,避免破图
    img.addEventListener('error', () => {
      img.style.opacity = '0.4'
      img.title = this.alt || '表情包图片加载失败'
    })
    return img
  }

  override ignoreEvent(): boolean {
    return true
  }
}

function buildStickerDecorations(view: EditorView): { decorations: DecorationSet; atoms: DecorationSet } {
  const text = view.state.doc.toString()
  const ranges: { from: number; to: number; dec: Decoration }[] = []

  STICKER_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = STICKER_RE.exec(text))) {
    const full = m[0]
    const srcMatch = SRC_RE.exec(full)
    if (!srcMatch) continue
    const src = srcMatch[1] ?? ''
    const alt = /!\[([^\]]*)\]/.exec(full)?.[1] ?? ''
    const dec = Decoration.replace({ widget: new StickerImageWidget(src, alt) })
    ranges.push({ from: m.index, to: m.index + full.length, dec })
  }

  ranges.sort((a, b) => a.from - b.from || a.to - b.to)
  const builder = new RangeSetBuilder<Decoration>()
  const atomBuilder = new RangeSetBuilder<Decoration>()
  for (const r of ranges) {
    builder.add(r.from, r.to, r.dec)
    atomBuilder.add(r.from, r.to, r.dec)
  }
  return { decorations: builder.finish(), atoms: atomBuilder.finish() }
}

const stickerViewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    atoms: DecorationSet
    constructor(view: EditorView) {
      const built = buildStickerDecorations(view)
      this.decorations = built.decorations
      this.atoms = built.atoms
    }
    update(update: ViewUpdate) {
      // 装饰只依赖文档内容,与视口无关;滚动(viewportChanged)重建是纯浪费
      if (update.docChanged) {
        const built = buildStickerDecorations(update.view)
        this.decorations = built.decorations
        this.atoms = built.atoms
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    provide: (plugin) => EditorView.atomicRanges.of((view) => view.plugin(plugin)?.atoms ?? RangeSet.empty),
  }
)

export const stickerViewExtension: Extension = stickerViewPlugin
