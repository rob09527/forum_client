import { RangeSetBuilder, RangeSet, EditorState, type Extension, type Transaction } from '@codemirror/state'
import { Decoration, type DecorationSet, ViewPlugin, EditorView, type ViewUpdate } from '@codemirror/view'

/**
 * CodeMirror 所见即所得颜色扩展,两部分:
 *
 * 1. 显示装饰(ViewPlugin):把 <span style="color:X">文字</span> 的标签隐藏、
 *    文字直接显示为颜色,让普通用户在编辑区看不到 HTML 代码。
 *    文档仍是 Markdown 纯文本,只做显示层装饰;标签用 Decoration.replace
 *    (atomic:光标跳过、退格整体删除,保护标签完整)。
 *
 * 2. 上色逻辑(transactionFilter):拦截颜色按钮的 insert 事务。
 *    - 选区落在已有颜色 span 内 → 直接替换该 span 的颜色值(改色,不嵌套)
 *    - 否则 → 正常插入新 span(嵌套由解析树天然支持,内层颜色覆盖外层)
 *    这样「对红字再选紫色」得到的是紫色替换,而非嵌套出损坏标签
 *    (CodeMirror 双击选词会把 <span 的字母和相邻中文归为同一 word,选区会
 *    越过隐藏标签,若盲目嵌套会产生半个标签)。
 */
const OPEN_RE = /<span\s+style="color:\s*([^"]+)"\s*>/g
const CLOSE_RE = /<\/span>/g
// 颜色按钮插入的完整新文本:open + selected + close
const COLOR_INSERT_RE = /^<span\s+style="color:\s*([^"]+)"\s*>[\s\S]*<\/span>$/

// 只允许 hex 色或纯字母命名色,杜绝注入任何危险 CSS 值
const COLOR_SAFE = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{2,20})$/

/** 一棵颜色 span:开/闭标签位置 + 颜色 + 子节点(嵌套 span) */
interface ColorNode {
  color: string
  openFrom: number
  openTo: number
  closeFrom: number
  closeTo: number
  children: ColorNode[]
}

/** 解析文档,构造颜色 span 树(栈配对天然成树,未闭合/孤立标签容错) */
function parseColorTree(text: string): ColorNode[] {
  const opens: { from: number; to: number; color: string }[] = []
  const closes: { from: number; to: number }[] = []
  let m: RegExpExecArray | null

  OPEN_RE.lastIndex = 0
  while ((m = OPEN_RE.exec(text))) {
    opens.push({ from: m.index, to: m.index + m[0].length, color: (m[1] ?? '').trim() })
  }
  CLOSE_RE.lastIndex = 0
  while ((m = CLOSE_RE.exec(text))) {
    closes.push({ from: m.index, to: m.index + m[0].length })
  }

  const events: ({ pos: number; kind: 'open'; data: (typeof opens)[number] } | { pos: number; kind: 'close'; data: (typeof closes)[number] })[] = [
    ...opens.map((d) => ({ pos: d.from, kind: 'open' as const, data: d })),
    ...closes.map((d) => ({ pos: d.from, kind: 'close' as const, data: d })),
  ]
  events.sort((a, b) => a.pos - b.pos)

  const roots: ColorNode[] = []
  const stack: ColorNode[] = []
  for (const ev of events) {
    if (ev.kind === 'open') {
      stack.push({ color: ev.data.color, openFrom: ev.data.from, openTo: ev.data.to, closeFrom: -1, closeTo: -1, children: [] })
    } else if (stack.length) {
      const node = stack.pop()!
      node.closeFrom = ev.data.from
      node.closeTo = ev.data.to
      if (stack.length) stack[stack.length - 1]!.children.push(node)
      else roots.push(node)
    }
  }
  return roots
}

/**
 * 找到包含 pos 的最深层颜色 span(按 openFrom~closeTo 全标签范围判定)。
 * 用「全标签范围」而不是「内容区间」:双击选词时选区会跨到隐藏的 <span>/</span>
 * 标签上(CodeMirror 把 CJK 与相邻字母归为同一 word),若只看内容区间会漏判。
 * 返回最深节点:嵌套时最内层颜色覆盖外层,应改内层。
 */
function findDeepestColorSpan(nodes: ColorNode[], pos: number): ColorNode | null {
  for (const node of nodes) {
    if (pos >= node.openFrom && pos <= node.closeTo) {
      return findDeepestColorSpan(node.children, pos) ?? node
    }
  }
  return null
}

/** 算出 span 节点 open 标签内颜色值的字符区间(解析失败返回 -1) */
function colorValueRange(node: ColorNode, text: string): { from: number; to: number } {
  const openTag = text.slice(node.openFrom, node.openTo)
  const vm = /color:\s*([^"]+)/.exec(openTag)
  const colorStr = vm ? (vm[1] ?? '') : ''
  const from = vm ? node.openFrom + vm.index + vm[0].indexOf(colorStr) : -1
  return { from, to: from >= 0 ? from + colorStr.length : -1 }
}

/** 生成两组装饰:decorations 供渲染,atoms 供原子光标/删除(仅隐藏标签的 replace 区间) */
function buildDecorations(view: EditorView): { decorations: DecorationSet; atoms: DecorationSet } {
  const text = view.state.doc.toString()
  const nodes = parseColorTree(text)
  const ranges: { from: number; to: number; dec: Decoration }[] = []
  const atoms: { from: number; to: number; dec: Decoration }[] = []
  const visit = (node: ColorNode) => {
    if (!COLOR_SAFE.test(node.color)) {
      node.children.forEach(visit)
      return
    }
    const openDec = Decoration.replace({})
    ranges.push({ from: node.openFrom, to: node.openTo, dec: openDec })
    atoms.push({ from: node.openFrom, to: node.openTo, dec: openDec })
    const closeDec = Decoration.replace({})
    ranges.push({ from: node.closeFrom, to: node.closeTo, dec: closeDec })
    atoms.push({ from: node.closeFrom, to: node.closeTo, dec: closeDec })
    let cursor = node.openTo
    for (const child of node.children) {
      if (cursor < child.openFrom) ranges.push({ from: cursor, to: child.openFrom, dec: Decoration.mark({ attributes: { style: `color:${node.color}` } }) })
      cursor = child.closeTo
    }
    if (cursor < node.closeFrom) ranges.push({ from: cursor, to: node.closeFrom, dec: Decoration.mark({ attributes: { style: `color:${node.color}` } }) })
    node.children.forEach(visit)
  }
  nodes.forEach(visit)

  const toSet = (list: { from: number; to: number; dec: Decoration }[]) => {
    list.sort((a, b) => a.from - b.from || a.to - b.to)
    const builder = new RangeSetBuilder<Decoration>()
    for (const r of list) builder.add(r.from, r.to, r.dec)
    return builder.finish()
  }
  return { decorations: toSet(ranges), atoms: toSet(atoms) }
}

const colorViewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    atoms: DecorationSet
    constructor(view: EditorView) {
      const built = buildDecorations(view)
      this.decorations = built.decorations
      this.atoms = built.atoms
    }
    update(update: ViewUpdate) {
      // 装饰只依赖文档内容,与视口无关;滚动(viewportChanged)重建是纯浪费
      if (update.docChanged) {
        const built = buildDecorations(update.view)
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

/**
 * 上色事务过滤器:识别颜色按钮的 insert,选区落在已有颜色 span 内时
 * 改为替换该 span 的颜色值(改色而非嵌套)。
 */
const colorInsertFilter = EditorState.transactionFilter.of((tr: Transaction) => {
  if (!tr.docChanged) return tr
  // 用数组收集:闭包内赋值会让 TS 把对象收窄成 never,数组 push 不触发该问题
  const replaced: { from: number; to: number; text: string }[] = []
  tr.changes.iterChanges((from, to, _fromB, _toB, ins) => {
    if (replaced.length === 0 && from !== to && ins.length) replaced.push({ from, to, text: ins.toString() })
  })
  if (replaced.length === 0) return tr
  const { from, to, text } = replaced[0]!

  const m = COLOR_INSERT_RE.exec(text)
  if (!m) return tr
  const newColor = (m[1] ?? '').trim()
  if (!COLOR_SAFE.test(newColor)) return tr

  // 用旧文档(改色前的 doc)解析 span,找选区中点所在的最深层颜色 span
  // (按全标签范围判定,选区可能跨到隐藏标签上,只看内容区间会漏判)。
  const oldDoc = tr.startState.doc.toString()
  const best = findDeepestColorSpan(parseColorTree(oldDoc), (from + to) / 2)
  // 普通文本上色:选区不在任何既有 span 内,走默认嵌套插入
  if (!best || !COLOR_SAFE.test(best.color)) return tr

  // 改色:仅替换该 span 的颜色值,不改变文字内容
  const cv = colorValueRange(best, oldDoc)
  if (cv.from < 0) return tr
  return [
    tr.startState.update({
      changes: { from: cv.from, to: cv.to, insert: newColor },
    }),
  ]
})

export const colorViewExtension: Extension = [colorViewPlugin, colorInsertFilter]
