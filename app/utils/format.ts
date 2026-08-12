/** 数字格式化：1234 → "1.2k"，156789 → "156.8k" */
export function formatCount(n: number): string {
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
}

/** 用户等级 claw/leg/meat → 徽章配色 */
const LEVEL_BADGE: Record<string, string> = {
  claw: 'bg-zinc-700 text-zinc-400',
  leg: 'bg-amber-500/20 text-amber-400',
  meat: 'bg-red-500/20 text-red-400',
}

export function levelBadgeClassFor(level: string | null | undefined): string {
  return LEVEL_BADGE[level ?? ''] ?? 'bg-zinc-700 text-zinc-400'
}
