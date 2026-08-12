import type { Announcement, LatestReply } from '~/types'

/**
 * 静态演示数据。
 * 帖子列表/热门帖子已接入后端 API，不再在此维护；
 * 公告和最新回复暂未提供后端接口，先用 mock 兜底。
 */

/** 公告列表 */
export const mockAnnouncements: Announcement[] = [
  { id: 1, title: 'AI Base 社区公约 v2.0 — 请所有会员阅读', dotColor: 'text-red-400' },
  { id: 2, title: '诚招各板块版主，欢迎有热情的会员加入', dotColor: 'text-emerald-400' },
  { id: 3, title: 'AI 绘画板块月度精选作品展 — 6 月', dotColor: 'text-blue-400' },
]

/** 最新回复 */
export const mockLatestReplies: LatestReply[] = [
  { content: '这篇太有用了，刚好在搭企业知识库，Dify 和 RAGFlow 我都试了，感觉 RAGFlow 的 chunk 策略更灵活', user: '创业CTO', time: '3分钟前', initial: '创', color: 'bg-cyan-500/20 text-cyan-400' },
  { content: '5 个真实项目盲测也太狠了，蹲一个 Opus 5 的反杀', user: 'OpenAI员工', time: '8分钟前', initial: 'O', color: 'bg-blue-500/20 text-blue-400' },
  { content: 'LangGraph 的多 Agent 协作那块写得不错，但感觉 CrewAI 的 API 更简洁一些', user: 'AgentBuilder', time: '15分钟前', initial: 'A', color: 'bg-purple-500/20 text-purple-400' },
  { content: '那个 ComfyUI 工作流我复现了，参数确实好用，出图速度提升明显', user: '视觉探索者', time: '22分钟前', initial: '视', color: 'bg-pink-500/20 text-pink-400' },
  { content: '本地部署 DeepSeek-V4 用 Ollama 确实方便，但我的 M2 只有 16G 有点吃力', user: 'Mac用户', time: '28分钟前', initial: 'M', color: 'bg-amber-500/20 text-amber-400' },
]
