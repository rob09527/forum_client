/**
 * 装饰渲染约定（称号图片索引）。
 * 称号商品 renderValue = 图片索引 key（以 title-tag- 开头，对应 admin 的 TITLE_CATALOG key 约定），
 * 渲染时映射到 /images/title-icons/{key}.webp。
 * 前缀与路径只此一处定义，UsernameText / ShopItemCard 等组件共用，避免各处硬编码漂移。
 */

/** 称号图片索引前缀（webp 文件名主干约定；历史文本称号不以它开头） */
export const TITLE_IMAGE_PREFIX = 'title-tag-'

/** 是否为称号图片索引形态（渲染 webp 图；历史文本称号回退文字胶囊） */
export function isTitleImage(v: string | null | undefined): boolean {
  return !!v && v.startsWith(TITLE_IMAGE_PREFIX)
}

/** 称号图片索引 → 静态资源地址（/images/title-icons/{key}.webp） */
export function titleIconPath(key: string): string {
  return `/images/title-icons/${key}.webp`
}
