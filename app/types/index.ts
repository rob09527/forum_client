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
  /** 当前登录用户是否已收藏（未登录或未注入时为 false） */
  isBookmarked: boolean
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

/** 帖子评论树：楼层 + 楼中楼回复（递归嵌套；后端不保证返回 replies 字段，缺省视为无回复） */
export interface CommentTreeItem extends CommentItem {
  replies?: CommentTreeItem[]
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

/** 公告类型 */
export type AnnouncementType = 'normal' | 'important' | 'urgent' | 'activity'

/** 公告圆点颜色（按类型映射，替代写死的 dotColor 样式串） */
export const ANNOUNCEMENT_DOT_COLOR: Record<AnnouncementType, string> = {
  normal: 'text-zinc-500',
  important: 'text-blue-600',
  urgent: 'text-red-600',
  activity: 'text-emerald-600',
}

/** 公告（与后端 AnnouncementPublic 对齐） */
export interface Announcement {
  id: number
  title: string
  type: AnnouncementType
  link: string | null
}

/** 广告位位置（top 顶部横幅已下线） */
export type AdvertPosition = 'sidebar' | 'inline'

/** 广告位中文映射（后台管理页展示用） */
export const AdvertPositionLabel: Record<AdvertPosition, string> = {
  sidebar: '侧边栏',
  inline: '列表内嵌',
}

/** 广告（与后端 AdvertPublic 对齐） */
export interface Advert {
  id: number
  title: string | null
  image: string
  position: AdvertPosition
  link: string | null
  sortOrder: number
}

/** 最新注册用户项（侧边栏「欢迎新用户」展示用，与后端 NewUserItem 对齐） */
export interface NewUser {
  /** 用户 ID */
  id: number
  /** 用户名 */
  username: string
  /** 头像 URL，null 时前端用默认头像 */
  avatar: string | null
  /** 注册时间，ISO 8601 */
  createdAt: string
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

/** Telegram Login Widget 回调数据（snake_case，与后端 TelegramAuthData 对齐） */
export interface TelegramAuthInput {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
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
  /** 鸡腿余额。仅本人可见，陌生人返回 null */
  points: number | null
  /** 累计获得鸡腿，决定等级 [R20] */
  totalPointsEarned: number
  /** 星辰（荣誉）[R30] */
  stars: number
  postCount: number
  commentCount: number
  /** 粉丝数（冗余字段） */
  followerCount: number
  /** 关注数（冗余字段） */
  followingCount: number
  /** 当前登录用户是否已关注该用户（未登录或为自己时为 false） */
  isFollowing: boolean
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

// ── 游戏化配置（后台可控，GET /api/config/game，未配置时后端返回默认值） ──

/** 签到奖励配置（与后端 CheckinConfig 对齐） */
export interface CheckinConfig {
  /** 每日签到基础分 */
  base: number
  /** 连续签到每日加成系数 */
  streakBonusPerDay: number
  /** 连续签到加成上限 */
  streakBonusCap: number
  /** 里程碑间隔天数（如 7 → 第 7/14/21… 天） */
  milestoneEvery: number
  /** 里程碑奖励 */
  milestoneBonus: number
}

/** 单个等级配置（与后端 LevelConfig 对齐） */
export interface LevelConfig {
  /** 等级标识（User.level），唯一 */
  key: string
  /** 等级中文名 */
  name: string
  /** 升到该等级所需累计鸡腿（minTotal=0 为起始等级） */
  minTotal: number
}

/** 游戏化配置（GET /api/config/game 响应） */
export interface GameConfig {
  checkin: CheckinConfig
  levels: LevelConfig[]
}

// ── 收藏 / 关注 / 通知（关系链） ──

/** 收藏列表项（GET /api/me/bookmarks，与后端 BookmarkItem 对齐） */
export interface BookmarkItem {
  /** 收藏时间，ISO 8601 */
  bookmarkedAt: string
  /** 帖子摘要（与帖子列表同一结构） */
  post: PostListItem
}

/** 关注/粉丝列表项（与后端 FollowUserItem 对齐） */
export interface FollowUserItem {
  id: number
  username: string
  avatar: string | null
  level: string
}

/** 用户搜索项（@提及候选下拉用） */
export interface UserSummary {
  id: number
  username: string
  avatar: string | null
  level: string
}

/** 通知触发者摘要 */
export interface NotificationActor {
  id: number
  username: string
  avatar: string | null
}

/** 通知项（与后端 NotificationItem 对齐） */
export interface NotificationItem {
  id: number
  /** comment | reply | like | follow | system | mention */
  type: string
  /** 触发者列表（最多 3 个；system 为空数组） */
  actors: NotificationActor[]
  /** 触发者总数（聚合累计事件数，actorIds 截断后的真实人数/次数） */
  actorCount: number
  /** 关联帖子 ID，帖子已删或无关为 null */
  postId: number | null
  /** 帖子标题，帖子已删或无关为 null */
  postTitle: string | null
  /** 关联评论 ID */
  commentId: number | null
  /** 评论内容截断 */
  commentExcerpt: string | null
  /** 通知正文（system 用） */
  content: string | null
  /** 是否已读 */
  isRead: boolean
  /** 通知时间，ISO 8601 */
  createdAt: string
}

/** 通知类型中文文案模板 */
export const NotificationTypeLabel: Record<string, string> = {
  comment: '评论了你的帖子',
  reply: '回复了你的评论',
  like: '赞了你的内容',
  follow: '关注了你',
  system: '系统通知',
  mention: '提到了你',
}
