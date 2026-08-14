import type { ApiResponse } from '~/types'
import { useApiBase } from './api'

/** 后端下发的权威头像风格清单 */
export interface AvatarStylesPayload {
  /** 权威风格 id 列表（顺序即确定性映射的依据，前后端共用） */
  styles: string[]
  /** 每风格预置头像数量 */
  perStyle: number
}

/**
 * 模块级缓存：客户端 SPA 导航不会重新加载 JS 模块，首次成功后此值存活，
 * 使后续导航同步拿到完整风格列表，避免头像先以兜底风格渲染再翻新（闪烁）。
 */
let cachedStyles: AvatarStylesPayload | null = null

/**
 * 权威头像风格清单（后端 /api/avatar-styles 下发，单一来源）。
 * 用 useAsyncData 按 key 缓存，SSR 与客户端共用同一 payload，保证头像水合一致；
 * 后端不可达/首帧未返回时 default 兜底（有缓存用缓存，无缓存退化为单一风格），不崩溃。
 */
export function useAvatarStyles() {
  const apiBase = useApiBase()
  return useAsyncData<AvatarStylesPayload>('avatar-styles', async () => {
    const res = await $fetch<ApiResponse<AvatarStylesPayload>>(`${apiBase.value}/api/avatar-styles`)
    cachedStyles = res.data
    return res.data
  }, {
    default: () => cachedStyles ?? { styles: [] as string[], perStyle: 20 },
  })
}
