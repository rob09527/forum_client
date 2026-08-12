import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

marked.setOptions({ gfm: true, breaks: true })

/**
 * Markdown → 净化后的 HTML。
 * 后端只存 Markdown 文本，前端负责渲染；DOMPurify 是防 XSS 的最后一道防线，
 * 即使有人绕过前端直接 POST 恶意脚本，这里也会过滤掉（SSR 时由 jsdom 兜底）。
 */
export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw ?? '') as string
  // 链接在新窗口打开；禁掉未净化场景下的自动跳转，避免钓鱼
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target'],
  })
}
