/**
 * 头像 URL 生成工具。
 * 优先级：TG 照片（user.avatar）> 用户选择的 DiceBear 风格 > 默认 bottts-neutral 机器人头像
 */

/** DiceBear 9.x 可选头像风格 */
export const DICEBEAR_STYLES = [
  { id: 'bottts-neutral',     label: '机器人', icon: '🤖' },
  { id: 'avataaars',          label: '卡通',   icon: '👤' },
  { id: 'pixel-art',          label: '像素',   icon: '👾' },
  { id: 'identicon',          label: '几何',   icon: '🔷' },
  { id: 'lorelei',            label: '顽趣',   icon: '😄' },
  { id: 'thumbs',             label: '拇指',   icon: '👍' },
  { id: 'rings',              label: '环形',   icon: '💍' },
  { id: 'shapes',             label: '形状',   icon: '🔺' },
  { id: 'adventurer',         label: '冒险',   icon: '🧭' },
  { id: 'adventurer-neutral', label: '冒险2',  icon: '🗺️' },
  { id: 'big-ears',           label: '大耳',   icon: '👂' },
  { id: 'big-ears-neutral',   label: '大耳2',  icon: '🐰' },
  { id: 'big-smile',          label: '笑脸',   icon: '😁' },
  { id: 'croodles',           label: '涂鸦',   icon: '✏️' },
  { id: 'croodles-neutral',   label: '涂鸦2',  icon: '🖍️' },
  { id: 'fun-emoji',          label: '表情',   icon: '😎' },
  { id: 'glass',              label: '玻璃',   icon: '🪟' },
  { id: 'micah',              label: '米卡',   icon: '🧑' },
  { id: 'miniavs',            label: '迷你',   icon: '🟢' },
  { id: 'notionists',         label: '印象',   icon: '🎨' },
  { id: 'notionists-neutral', label: '印象2',  icon: '🖼️' },
  { id: 'open-peeps',         label: '人物',   icon: '🙂' },
  { id: 'personas',           label: '角色',   icon: '🦸' },
] as const

export type DicebearStyle = (typeof DICEBEAR_STYLES)[number]['id']

/**
 * 根据用户名生成 DiceBear 头像 URL。
 * @param username - 用户名，作为随机种子
 * @param style - DiceBear 风格，默认 bottts-neutral
 */
export function dicebearUrl(username: string, style: string = 'bottts-neutral'): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(username)}`
}

/**
 * 解析用户头像展示 URL。
 * - 有 avatar（TG 照片或用户已选择的 DiceBear URL）→ 直接用
 * - 有 username → DiceBear 默认风格自动生成
 * - 都没有 → null
 */
export function getAvatarUrl(username?: string | null, avatar?: string | null): string | null {
  if (avatar) return avatar
  if (username) return dicebearUrl(username)
  return null
}

/** 首字母回退（img 加载中/失败时展示） */
export function avatarInitial(name?: string | null): string {
  return name?.charAt(0).toUpperCase() ?? '?'
}
