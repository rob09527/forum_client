import type { CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete'
import type { UserSummary } from '~/types'

/**
 * @提及自动补全源（CodeMirror CompletionSource）。
 *
 * 触发：光标处于 `(行首|空格)@` 之后时弹出候选人，点选后插入结构化链接
 * `[@用户名](/user/id)` —— 与编辑器内置「链接」按钮同形态，marked 原生渲染成
 * 个人主页链接，后端也只认这种形式（见 server utils/mention.ts）。
 *
 * 防抖/过期结果由 @codemirror/autocomplete 内置处理（100ms 击键防抖、
 * 运行中查询不重复发起、事务回放 + validFor 校验过期结果），这里不需要自建。
 *
 * 依赖注入 searchUsers：补全源在编辑事件回调里执行，不持有 Nuxt 上下文，
 * 由组件 setup 传入已绑定的搜索函数。
 */

/** 用户名 = TG 名([a-z0-9_]) 或 user_ + nanoid([a-z0-9_-])，[\w-] 足够覆盖；上限 40 兜底 */
const MENTION_TRIGGER = /(?:^|\s)@([\w-]{0,40})$/i

/** 补全打开后继续键入仍保持该弹层（直到输入脱离 @xx 形态） */
const MENTION_VALID = /^@[\w-]*$/i

export function mentionCompletion(
  searchUsers: (q: string) => Promise<UserSummary[]>,
): CompletionSource {
  return async (ctx: CompletionContext): Promise<CompletionResult | null> => {
    const match = ctx.matchBefore(MENTION_TRIGGER)
    if (!match) return null

    // match.text = 触发前缀 + @ + 查询词（如 ` @rob`），去掉前置空白和 @ 即得查询词
    const q = match.text.replace(/^\s*@/, '')
    // 裸 @ 不弹候选，等输入至少一个字符再搜
    if (q.length === 0) return null

    let users: UserSummary[]
    try {
      users = await searchUsers(q)
    } catch {
      // 搜索失败不打断编辑，静默不返回候选
      return null
    }

    return {
      // 从 @ 开始替换（match 一定结束于光标处）
      from: ctx.pos - q.length - 1,
      options: users.map((u) => ({
        label: `@${u.username}`,
        type: 'user',
        detail: u.level,
        apply: `[@${u.username}](/user/${u.id}) `,
      })),
      validFor: MENTION_VALID,
    }
  }
}
