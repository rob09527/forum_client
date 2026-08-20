/** 数字格式化：1234 → "1.2k"，156789 → "156.8k" */
export function formatCount(n: number): string {
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
}
