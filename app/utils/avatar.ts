/**
 * 头像工具。
 * 头像已完全本地化：不再依赖 DiceBear 外网服务（大陆访问不稳定），改为项目内置的预置头像
 * （public/avatars/{style}/avatar-01.svg ~ avatar-20.svg）。
 *
 * 权威风格 id 列表与每风格数量（perStyle）均由后端 /api/avatar-styles 下发（单一来源，
 * 见 useAvatarStyles），本文件不复制风格清单、只保留 id → 展示文案（label/icon）的映射；
 * 确定性哈希算法与 server/src/utils/avatar.ts 保持一致，
 * 保证「同用户名在前后端算出的头像路径完全一致」。
 *
 * 展示优先级：TG 照片（真实外链）> 本地预置头像（avatar 为 /avatars/... 或按用户名确定性映射）
 */

/** 风格 id → 展示文案（纯展示，与后端 id 顺序无关；id 列表以后端下发为准） */
const STYLE_META: Record<string, { label: string; icon: string }> = {
  'bottts-neutral':     { label: '机器人', icon: '🤖' },
  avataaars:            { label: '卡通',   icon: '👤' },
  'pixel-art':          { label: '像素',   icon: '👾' },
  identicon:            { label: '几何',   icon: '🔷' },
  lorelei:              { label: '顽趣',   icon: '😄' },
  thumbs:               { label: '拇指',   icon: '👍' },
  adventurer:           { label: '冒险',   icon: '🧭' },
  'adventurer-neutral': { label: '冒险2',  icon: '🗺️' },
  'big-ears':           { label: '大耳',   icon: '👂' },
  'big-ears-neutral':   { label: '大耳2',  icon: '🐰' },
  'big-smile':          { label: '笑脸',   icon: '😁' },
  croodles:             { label: '涂鸦',   icon: '✏️' },
  'fun-emoji':          { label: '表情',   icon: '😎' },
  micah:                { label: '米卡',   icon: '🧑' },
  miniavs:              { label: '迷你',   icon: '🟢' },
  notionists:           { label: '印象',   icon: '🎨' },
  'open-peeps':         { label: '人物',   icon: '🙂' },
  personas:             { label: '角色',   icon: '🦸' },
}

/** 头像风格定义（id + 展示文案），AvatarPicker 用 */
export interface AvatarStyleDef {
  id: string
  label: string
  icon: string
}

/** 由后端下发的权威风格 id 列表派生展示列表（未知 id 兜底显示 id 本身） */
export function deriveStyleDefs(styleIds: string[]): AvatarStyleDef[] {
  return styleIds.map((id) => ({
    id,
    label: STYLE_META[id]?.label ?? id,
    icon: STYLE_META[id]?.icon ?? '👤',
  }))
}

/** 风格列表未就绪（后端不可达/首帧未返回）时的兜底，避免确定性映射对空数组取下标 */
const FALLBACK_STYLES = ['bottts-neutral']

/** 兜底每风格数量（后端不可达时与 useAvatarStyles 默认一致） */
const FALLBACK_PER_STYLE = 20

/** 本地头像路径：/avatars/{style}/avatar-{nn}.svg */
export function localAvatarPath(style: string, index: number): string {
  return `/avatars/${style}/avatar-${String(index).padStart(2, '0')}.svg`
}

/** 简单确定性哈希（djb2），把用户名稳定映射到 0..mod-1。与 server/src/utils/avatar.ts 保持一致 */
function hashIndex(name: string, mod: number): number {
  let h = 5381
  for (let i = 0; i < name.length; i++) {
    h = (h * 33 + name.charCodeAt(i)) >>> 0
  }
  return h % mod
}

/**
 * 用户名 → 确定性本地头像路径（同用户名永远同头像）。
 * @param styleIds 后端下发的权威风格 id 列表（顺序即映射依据；空数组走 FALLBACK_STYLES）
 * @param perStyle 每风格预置头像数量（后端下发，避免手抄 AVATARS_PER_STYLE）
 */
export function deterministicLocalAvatar(username: string, styleIds: string[], perStyle: number): string {
  const styles = styleIds.length > 0 ? styleIds : FALLBACK_STYLES
  const nPerStyle = perStyle > 0 ? perStyle : FALLBACK_PER_STYLE
  const idx = hashIndex(username, styles.length * nPerStyle)
  // idx 始终落在 0..styles.length*perStyle-1，商必为合法风格下标
  const style = styles[Math.floor(idx / nPerStyle)]!
  const n = (idx % nPerStyle) + 1
  return localAvatarPath(style, n)
}

/**
 * 解析用户头像展示 URL。
 * - avatar 为本地预置路径（/avatars/...）→ 直接用
 * - avatar 为旧 DiceBear URL → 映射到本地确定性头像（去外网依赖）
 * - avatar 为其他真实图片（TG 照片等）→ 直接用
 * - 都没有 → 用户名确定性映射到本地头像
 * @param styleIds 后端下发的权威风格 id 列表（未就绪时传空数组，内部兜底）
 * @param perStyle 每风格预置头像数量（后端下发；缺失时兜底 20）
 */
export function getAvatarUrl(
  username?: string | null,
  avatar?: string | null,
  styleIds?: string[],
  perStyle?: number,
): string | null {
  const styles = styleIds ?? []
  const nPerStyle = perStyle && perStyle > 0 ? perStyle : FALLBACK_PER_STYLE
  if (avatar && avatar.startsWith('/avatars/')) return avatar
  if (avatar && avatar.includes('api.dicebear.com')) {
    return username ? deterministicLocalAvatar(username, styles, nPerStyle) : null
  }
  if (avatar) return avatar
  if (username) return deterministicLocalAvatar(username, styles, nPerStyle)
  return null
}

/** 首字母回退（img 加载中/失败时展示） */
export function avatarInitial(name?: string | null): string {
  return name?.charAt(0).toUpperCase() ?? '?'
}
