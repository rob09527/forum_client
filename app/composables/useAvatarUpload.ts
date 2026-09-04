import { useUpload } from './useUpload'
import { useUserProfile } from './useUserProfile'
import { extractErrorMessage } from './api'
import { UPLOAD_PARTITION } from '~/constants/upload'

/**
 * 自定义头像上传（§9.2）。
 *
 * 两步走，**不新造上传通道**：
 *  ① `POST /api/upload`（复用 useUpload，已有 MIME 白名单 + 频率限流）→ 拿本地相对 path；
 *  ② `PUT /api/user/me/avatar`（复用 useUserProfile.updateAvatar）→ 落库，返回服务端最终认定的头像路径。
 *
 * 权威校验在**服务端**：≤2MB + 边长 ≤512 等比压缩 + 头像路径白名单正则。
 * 本文件的前置检查（`precheck`）只为「少一次无用往返、错得更快」，
 * **不作为安全边界**；服务端任何拒绝都原样转成 `error` 展示，不吞、不套 500 兜底文案。
 *
 * SSR 安全：`File` / `URL.createObjectURL` 只在 `upload()`（事件回调内调用）里触碰，
 * setup 阶段不接触任何浏览器 API；预览 objectURL 在作用域销毁时释放。
 */

/** 头像单文件体积上限（字节）；与服务端 2MB 口径一致，服务端才是权威 */
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024

/** 允许的头像 MIME 白名单；用于 <input accept> 与前置检查（服务端另有白名单) */
export const AVATAR_ACCEPT_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

/** `<input type="file" :accept>` 用的字符串形态 */
export const AVATAR_ACCEPT_ATTR = AVATAR_ACCEPT_MIME.join(',')

export function useAvatarUpload() {
  const { uploadImage } = useUpload()
  const { updateAvatar } = useUserProfile()

  /** 上传成功后服务端落库的头像路径；未上传过为 null */
  const data = ref<string | null>(null)
  /** 上传中（两步合一：POST /api/upload + PUT /api/user/me/avatar 全程为 true） */
  const isLoading = ref(false)
  /** 失败原因（人话，直接来自服务端 message 或前置检查）；成功/未开始为 null */
  const error = ref<string | null>(null)
  /** 本地预览地址（objectURL），仅浏览器侧存在；未选择文件为 null */
  const preview = ref<string | null>(null)

  /** 释放上一张预览的 objectURL，避免选多次泄漏 */
  function revokePreview() {
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
      preview.value = null
    }
  }

  /**
   * 前置检查（体验优化，非安全边界）。
   * @returns 不通过时返回人话原因；通过返回 null
   */
  function precheck(file: File): string | null {
    if (!AVATAR_ACCEPT_MIME.includes(file.type as (typeof AVATAR_ACCEPT_MIME)[number])) {
      return '只支持 JPG / PNG / WebP / GIF 图片'
    }
    if (file.size > AVATAR_MAX_SIZE) {
      const mb = (file.size / 1024 / 1024).toFixed(1)
      return `图片 ${mb}MB，超过 ${AVATAR_MAX_SIZE / 1024 / 1024}MB 上限，请换一张更小的`
    }
    return null
  }

  /**
   * 选中文件（只做预览与前置检查，不发请求）。
   * 必须在事件回调内调用（浏览器侧）。
   * @returns 前置检查是否通过
   */
  function select(file: File): boolean {
    error.value = null
    const bad = precheck(file)
    if (bad) {
      error.value = bad
      return false
    }
    revokePreview()
    preview.value = URL.createObjectURL(file)
    return true
  }

  /**
   * 上传并落库（两步）。失败时 `error` 有值并抛出，调用方可直接重试同一个 file。
   * @param file 用户选择的图片文件
   * @returns 服务端最终落库的头像路径（如 `/uploads/avatars/xxx.webp`）
   */
  async function upload(file: File): Promise<string> {
    error.value = null
    const bad = precheck(file)
    if (bad) {
      error.value = bad
      throw new Error(bad)
    }

    isLoading.value = true
    try {
      // ① 落地到本站上传目录，拿相对 path（换域名不失效）
      // 必须显式指定 avatars 分区：默认是正文图 posts，落错分区会在下一步
      // `updateAvatar` 的路径白名单（服务端 `assertAllowedAvatarPath`）那里被拒。
      const { path } = await uploadImage(file, UPLOAD_PARTITION.AVATARS)
      // ② 写入 users.avatar；服务端会再校验路径白名单，返回它认定的最终值
      const avatar = await updateAvatar(path)
      data.value = avatar
      return avatar
    } catch (err: unknown) {
      // 服务端拒绝（体积/尺寸/格式/限流/路径白名单）原样透出，不换成兜底文案
      error.value = extractErrorMessage(err, '头像上传失败，请重试')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /** 重置三件套与预览（关弹窗 / 换成预置头像时调用） */
  function reset() {
    revokePreview()
    data.value = null
    error.value = null
    isLoading.value = false
  }

  // 组件卸载时释放预览 URL（setup 阶段注册，SSR 下不执行任何浏览器 API）
  onScopeDispose(revokePreview)

  return { data, isLoading, error, preview, select, upload, reset }
}
