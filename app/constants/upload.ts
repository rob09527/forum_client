/**
 * 上传分区名 —— **`server/src/constants/upload-paths.ts` 的手工镜像**。
 *
 * ⛔ 这不是共享代码,是**两份需要人工同步的副本**:client 与 server 是各自独立的
 * TypeScript 工程(client 是 Nuxt,server 是独立 ESM 包),没有 workspace 依赖,
 * 前端 `import` 不到后端的源码。所以只能镜像。
 *
 * 同步契约(改任意一侧都要做):
 * 1. 分区名字面量必须与 `server/src/constants/upload-paths.ts` 的 `UploadPartition` 逐字相同;
 * 2. 后端 `parseUploadPartition()` 是**白名单 + 不信任客户端**的,只接受 `posts` / `avatars`
 *    (`legacy`/`system` 不许用户直传),所以本文件**刻意只镜像这两个**,不镜像全集 ——
 *    前端写一个后端不收的分区名,结果是 400,不是静默落错目录;
 * 3. 拼错/漂移的表现是「上传成功但落库被拒」,报错指向落库、病根在分区,隔两层难查
 *    —— 这正是不许在调用点写 `'avatars'` 字面量的原因(前端准则第 ⑧ 条)。
 *
 * 后端那侧已加了指回本文件的注释;若发现只有单侧注释,说明有人改了一半,请补齐。
 */
export const UPLOAD_PARTITION = {
  /** 发帖/评论正文图。后端会再插一层 `YYYYMMDD` 子目录;**这是 `uploadImage()` 的默认分区** */
  POSTS: 'posts',
  /** 用户头像。后端不加日期子目录(头像是低频覆盖写),文件名带 `a` 前缀 */
  AVATARS: 'avatars',
} as const

/** 允许前端直传的分区名联合类型 */
export type UploadPartition = (typeof UPLOAD_PARTITION)[keyof typeof UPLOAD_PARTITION]
