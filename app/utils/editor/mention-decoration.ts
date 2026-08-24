import { RangeSetBuilder, RangeSet, type Extension } from '@codemirror/state'
import { Decoration, type DecorationSet, ViewPlugin, EditorView, type ViewUpdate } from '@codemirror/view'

/**
 * @提及所见即所得装饰：把结构化链接 [@用户名](/user/id) 的语法在编辑区隐藏，
 * 只显示 @用户名（蓝色，观感同链接），用户不再看到 `/user/3` 之类的内部细节。
 * 文档仍是 Markdown 纯文本（后端解析、发布渲染都靠它），只做显示层装饰。
 *
 * 与颜色/表情包装饰同思路（见 color-decoration.ts / sticker-decoration.ts）：
 * - 隐藏区间用 Decoration.replace 并计入 atoms（原子光标/删除，保护语法完整）；
 * - @用户名 用 Decoration.mark 上色，不进 atoms（保留可编辑）；
 * - update 只监听 docChanged，滚动(viewportChanged)重建是纯浪费。
 */

/** 结构化提及链接：[@显示名](/user/数字id)。group1 = @显示名 */
const MENTION_RE = /\[(@[^\]]+)\]\(\/user\/(\d+)\)/g

/** 提及高亮色：与站点链接色 text-blue-600 一致 */
const MENTION_COLOR = '#2563eb'

function buildMentionDecorations(view: EditorView): { decorations: DecorationSet; atoms: DecorationSet } {
  const text = view.state.doc.toString()
  const ranges: { from: number; to: number; dec: Decoration }[] = []
  const atoms: { from: number; to: number; dec: Decoration }[] = []

  MENTION_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = MENTION_RE.exec(text))) {
    const start = m.index
    const textStart = start + 1 // @ 开头
    const textEnd = textStart + (m[1]?.length ?? 0) // ] 之前
    const end = start + m[0].length

    // 隐藏左括号 [
    const openDec = Decoration.replace({})
    ranges.push({ from: start, to: start + 1, dec: openDec })
    atoms.push({ from: start, to: start + 1, dec: openDec })
    // 隐藏 ](/user/id) 尾段
    const tailDec = Decoration.replace({})
    ranges.push({ from: textEnd, to: end, dec: tailDec })
    atoms.push({ from: textEnd, to: end, dec: tailDec })
    // @用户名 高亮（mark，不进 atoms——保留可编辑）
    ranges.push({ from: textStart, to: textEnd, dec: Decoration.mark({ attributes: { style: `color:${MENTION_COLOR}` } }) })
  }

  ranges.sort((a, b) => a.from - b.from || a.to - b.to)
  atoms.sort((a, b) => a.from - b.from || a.to - b.to)
  const builder = new RangeSetBuilder<Decoration>()
  for (const r of ranges) builder.add(r.from, r.to, r.dec)
  const atomBuilder = new RangeSetBuilder<Decoration>()
  for (const r of atoms) atomBuilder.add(r.from, r.to, r.dec)
  return { decorations: builder.finish(), atoms: atomBuilder.finish() }
}

const mentionViewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    atoms: DecorationSet
    constructor(view: EditorView) {
      const built = buildMentionDecorations(view)
      this.decorations = built.decorations
      this.atoms = built.atoms
    }
    update(update: ViewUpdate) {
      // 装饰只依赖文档内容,与视口无关;滚动(viewportChanged)重建是纯浪费
      if (update.docChanged) {
        const built = buildMentionDecorations(update.view)
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

export const mentionViewExtension: Extension = mentionViewPlugin
