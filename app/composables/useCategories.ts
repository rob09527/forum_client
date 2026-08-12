import type { Category } from '~/types'
import { mainCategories, subTags } from '~/constants/categories'

/**
 * 从后端获取分类和标签数据。
 * SSR 时直连 Fastify（Nitro devProxy 不代理内部 $fetch），
 * 客户端通过浏览器 → Vite proxy → Fastify。
 * 失败时回退到静态常量。
 */
export function useCategories() {
  const config = useRuntimeConfig()
  // SSR 时 $fetch 不经过 Nitro devProxy，需要完整 URL
  const apiBase = import.meta.server ? config.apiBase as string : ''

  const { data: catData } = useAsyncData('forum-categories', () =>
    $fetch<{ success: boolean; data: Category[] }>(`${apiBase}/api/categories`)
  )

  const { data: tagData } = useAsyncData('forum-tags', () =>
    $fetch<{ success: boolean; data: string[] }>(`${apiBase}/api/tags`)
  )

  const categories = computed<Category[]>(() => {
    if (catData.value?.success && catData.value.data.length > 0) {
      return catData.value.data
    }
    return mainCategories
  })

  const tags = computed<string[]>(() => {
    if (tagData.value?.success && tagData.value.data.length > 0) {
      return tagData.value.data
    }
    return subTags
  })

  return { categories, tags }
}
