import type { ApiResponse } from '~/types'
import { useApiBase, extractErrorMessage } from './api'

/**
 * 图片上传。
 * 发帖编辑器点图片按钮 → 选文件 → uploadImage(file) → 返回 { url, path }。
 * 落库一律用相对 path（换域名/环境不失效，渲染时走同源反代解析）；url 仅供个别场景直接展示。
 * 失败抛异常（已转换为用户可读消息）。
 */
export function useUpload() {
  const apiBase = useApiBase()

  const uploading = ref(false)
  const progress = ref(0) // 0-100
  const error = ref('')

  /** 上传单张图片 */
  async function uploadImage(file: File): Promise<{ url: string; path: string }> {
    const formData = new FormData()
    formData.append('file', file)

    uploading.value = true
    error.value = ''
    progress.value = 0

    try {
      const res = await $fetch<ApiResponse<{ url: string; path: string }>>(
        `${apiBase.value}/api/upload`,
        { method: 'POST', body: formData }
      )
      progress.value = 100
      return res.data
    } catch (err: any) {
      error.value = extractErrorMessage(err, '上传失败')
      throw new Error(error.value)
    } finally {
      uploading.value = false
    }
  }

  return { uploading, progress, error, uploadImage }
}
