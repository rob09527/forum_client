import { marked, type Tokens } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

marked.setOptions({ gfm: true, breaks: true })

/**
 * 本站 host 白名单(**只比 hostname,不比端口**)。
 *
 * 用途:判定正文里的链接是「站内导航」还是「站外跳转」。⛔ 刻意**不读 `window.location`**——
 * `renderMarkdown` 在 SSR 阶段也会执行(DOMPurify 走 jsdom),读 window 会崩或判错,
 * 且服务端/客户端判定不一致会直接引发 hydration mismatch(本项目已踩过 3 次)。
 * 所以这里用编译期常量,新增部署域名时**必须同步加进来**,否则本站链接会被当成外链开新标签页。
 *
 * 取值来源:`server/.env` 的 `ALLOWED_ORIGINS`(dev:localhost / 127.0.0.1 / 192.168.3.48)
 * 与测试/生产域名(`docs/nginx/test-server.conf`:web.aibases.net)。
 */
const SITE_HOSTS = new Set(['localhost', '127.0.0.1', '192.168.3.48', 'web.aibases.net'])

/**
 * 是否为**站外** http(s) 链接(只有它才需要 `target="_blank"`)。
 *
 * 判定口径(三条,顺序即优先级):
 * 1. 非 `http(s)://` 开头(相对路径 `/post/123`、锚点 `#floor-3`、`mailto:`/`tel:`)→ 站内,不加 target;
 * 2. 绝对地址但 hostname 命中 `SITE_HOSTS` → 站内,不加 target(避免站内导航疯狂开新标签页);
 * 3. 其余(含 URL 解析失败的畸形地址)→ 解析失败按**站内**处理,保守不加 target。
 *
 * 已 export:编辑器分屏预览(`MarkdownEditor.client.vue`)走 md-editor-v3 自带的 markdown-it 渲染器,
 * 拿不到上面那个 marked renderer,只能在消毒后自己补 target。它**必须复用本函数**,
 * 否则两条链路的「站内/站外」口径会各自漂移。
 */
export function isExternalHref(href: string): boolean {
  const raw = href.trim()
  // Protocol-relative URLs are absolute links too. Resolve them against a fixed
  // protocol rather than window.location so SSR and preview use the same result.
  const isAbsolute = /^https?:\/\//i.test(raw)
  const isProtocolRelative = raw.startsWith('//')
  if (!isAbsolute && !isProtocolRelative) return false
  try {
    const parsed = new URL(isProtocolRelative ? `https:${raw}` : raw)
    return !SITE_HOSTS.has(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

/** HTML 属性值转义(拼 `<a>` 标签用;DOMPurify 是第二道防线,这里先把引号闭合破坏掉) */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * 链接渲染:**站外**链接强制新标签页打开。
 *
 * `rel="noopener noreferrer"` 不是可选项 —— `target="_blank"` 不带 noopener 会把
 * `window.opener` 句柄交给外站,外站可反向篡改本站页面(tabnabbing 钓鱼)。
 */
marked.use({
  renderer: {
    link(token: Tokens.Link): string {
      const text = this.parser.parseInline(token.tokens)
      const attrs = [`href="${escapeAttr(token.href)}"`]
      if (token.title) attrs.push(`title="${escapeAttr(token.title)}"`)
      if (isExternalHref(token.href)) attrs.push('target="_blank"', 'rel="noopener noreferrer"')
      return `<a ${attrs.join(' ')}>${text}</a>`
    },
  },
})

/**
 * Markdown → 净化后的 HTML。
 * 后端只存 Markdown 文本，前端负责渲染；DOMPurify 是防 XSS 的最后一道防线，
 * 即使有人绕过前端直接 POST 恶意脚本，这里也会过滤掉（SSR 时由 jsdom 兜底）。
 */
export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw ?? '') as string
  // 站外链接新窗口打开(见上方 renderer)。`target` 不在 DOMPurify 默认允许列表里,必须显式放行;
  // `rel` 本就在默认列表内(2026-09-04 实测:只给 ADD_ATTR:['target'] 时 rel 也不会被洗掉),
  // 这里一并写出是**显式声明依赖** —— 防止后来者收紧配置(如改用 ALLOWED_ATTR)时把 noopener 洗没。
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel'],
  })
}
