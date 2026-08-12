// ── 论坛核心类型定义 ──

/** 帖子列表项（与后端 PostListItem 对齐，不含正文） */
export interface PostListItem {
  id: number
  title: string
  category: string
  tags: string[]
  author: {
    id: number
    username: string
    avatar: string | null
    level: string
  }
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  lastReplyUser: string | null
  lastReplyTime: string | null
  createdAt: string
}

/** 帖子详情（列表项 + 正文 content + 最后更新时间） */
export interface PostDetail extends PostListItem {
  content: string
  /** 最后更新时间，ISO 8601（编辑后可展示"最后编辑于"） */
  updatedAt: string
}

/** 评论项（与后端 CommentItem 对齐） */
export interface CommentItem {
  id: number
  content: string
  postId: number
  parentId: number | null
  floor: number | null
  likeCount: number
  author: {
    id: number
    username: string
    avatar: string | null
    level: string
  }
  createdAt: string
}

/** 帖子评论树：楼层 + 楼中楼回复（递归嵌套） */
export interface CommentTreeItem extends CommentItem {
  replies: CommentTreeItem[]
}

/** 后端分页包装（data.items 为列表数据） */
export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** 统一 API 响应包装 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string; message: string }
}

export interface Category {
  slug: string
  name: string
  icon: string
  postCount: string
}

export interface Announcement {
  id: number
  title: string
  dotColor: string
}

export interface LatestReply {
  content: string
  user: string
  time: string
  initial: string
  color: string
}

export interface SortOption {
  label: string
  value: string
}

// ── 认证相关类型 ──

/** 用户等级中文映射 */
export const UserLevelLabel: Record<string, string> = {
  claw: '鸡爪',
  leg: '鸡腿',
  meat: '鸡肉',
}

/** 用户公开信息（与后端 UserPublic 对齐） */
export interface User {
  id: number
  username: string
  email: string | null
  avatar: string | null
  bio: string | null
  level: string
  points: number
  stars: number
  role: string
  oauthProvider: string | null
  createdAt: string
}

/** 登录/注册请求 */
export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  username: string
  email: string
  password: string
}

/** auth API 响应 */
export interface AuthResult {
  user: User
  token: string
}

// ── 积分 / 签到 / 等级 ──

/** 等级进度：当前等级 + 下一门槛 + 还差多少（与后端 LevelProgress 对齐）[R21] */
export interface LevelProgress {
  /** 当前等级：claw | leg | meat */
  level: string
  /** 下一等级所需累计鸡腿，最高等级为 null */
  nextLevelAt: number | null
  /** 距下一等级还差多少，最高等级为 0 */
  remaining: number
}

/** 公开用户资料（与后端 UserProfile 对齐，/api/user/:id/profile） */
export interface UserProfile {
  id: number
  username: string
  avatar: string | null
  bio: string | null
  /** 用户等级（claw | leg | meat） */
  level: string
  /** 鸡腿余额 */
  points: number
  /** 累计获得鸡腿，决定等级 [R20] */
  totalPointsEarned: number
  /** 星辰（荣誉）[R30] */
  stars: number
  postCount: number
  commentCount: number
  createdAt: string
  levelProgress: LevelProgress
}

/** 积分来源中文名映射（与后端 PointLog.type 对齐） */
export const PointTypeLabel: Record<string, string> = {
  checkin: '签到',
  post: '发帖',
  comment: '评论',
  liked: '被点赞',
}

/** 积分流水项（与后端 PointLogItem 对齐） */
export interface PointLogItem {
  id: number
  /** 积分来源：checkin | post | comment | liked */
  type: string
  /** 变动值（正数） */
  delta: number
  /** 变动后鸡腿余额 [R42] */
  balanceAfter: number
  /** 关联帖子/评论 ID，无关联为 null */
  refId: number | null
  /** 变动时间，ISO 8601 */
  createdAt: string
}

/** 签到状态（与后端 CheckinStatus 对齐，GET /api/checkin/status） */
export interface CheckinStatus {
  /** 连续签到天数 */
  streak: number
  /** 累计签到天数，永不归零 [R13] */
  totalDays: number
  /** 今天是否已签到 [R14] */
  checkedToday: boolean
  /** 今天签到可获得的鸡腿数 [R10][R11][R12] */
  todayDelta: number
  /** 指定月份内已签到的日期，格式 YYYY-MM-DD */
  calendar: string[]
}

/** 签到结果（POST /api/checkin） */
export interface CheckinResult {
  /** 本次签到获得的鸡腿 */
  delta: number
  /** 连续签到天数（含本次） */
  streak: number
  /** 累计签到天数 */
  totalDays: number
}
