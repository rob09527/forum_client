import type { ApiResponse } from '~/types'
import { useApiBase, extractErrorMessage } from './api'
import { UPLOAD_PARTITION, type UploadPartition } from '~/constants/upload'

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

  /**
   * 上传单张图片。
   *
   * @param file 待上传文件
   * @param partition 落盘分区,默认正文图 `posts` —— 默认值保证发帖/评论等现有调用点行为不变,
   *   只有头像上传(`useAvatarUpload`)需要显式传 `AVATARS`。分区名从 `constants/upload` 取,
   *   ⛔ 别在调用点写字面量。
   *
   * ⚠️ 分区**必须走 query 参数,不能改成 multipart 字段**:`@fastify/multipart` 的
   * `request.file()` 是流式解析,`data.fields` 只含在 file 分片**之前**流过的字段,
   * 而下面 `formData.append('file', ...)` 是第一个 append —— 写成字段的话后端根本读不到,
   * 且不报错,是**静默退化成默认分区**,然后在头像落库白名单那步被拒。
   * (报错指向落库、病根在解析顺序,隔两层,极难归因。forum-01 已实测确认。)
   */
  async function uploadImage(
    file: File,
    partition: UploadPartition = UPLOAD_PARTITION.POSTS
  ): Promise<{ url: string; path: string }> {
    const formData = new FormData()
    formData.append('file', file)

    uploading.value = true
    error.value = ''
    progress.value = 0

    try {
      const res = await $fetch<ApiResponse<{ url: string; path: string }>>(
        `${apiBase.value}/api/upload`,
        { method: 'POST', body: formData, query: { partition } }
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
