// ── 论坛核心类型定义 ──

/** 作者公开摘要（与后端 AuthorBrief 对齐，见 user-decorator.ts）+ 装饰生效槽。
 * 前端按「expireAt 未过期才生效」内联渲染（过期即恢复默认）[R46][1.3.7]。
 * 装饰是消费体系全站横切：所有出现"用户名"的地方都从这里取装饰值。 */
export interface AuthorBrief {
  /** 用户 ID */
  id: number
  /** 用户名 */
  username: string
  /** 头像 URL，null 时前端用默认头像 */
  avatar: string | null
  /** 等级标识（claw | leg | meat …） */
  level: string
  /** 生效中的用户名颜色渲染值（CSS 色值/渐变）；null 或已过期则不上色 */
  decorColorValue: string | null
  /** 用户名颜色到期时间，ISO 8601；与 value 成对存储，过期即失效 */
  decorColorExpireAt: string | null
  /** 生效中的专属称号文本；null 或已过期则无称号 */
  decorTitleValue: string | null
  /** 称号徽章配色 key（amber | violet | emerald …），由后端下发 */
  decorTitleStyle: string | null
  /** 称号到期时间，ISO 8601 */
  decorTitleExpireAt: string | null
}

/** 帖子列表项（与后端 PostListItem 对齐，不含正文） */
export interface PostListItem {
  id: number
  title: string
  category: string
  tags: string[]
  author: AuthorBrief
  viewCount: number
  likeCount: number
  commentCount: number
  /** 打赏人数（冗余；因 [R48] 一人一次，人数 = 笔数） */
  tipCount: number
  /** 打赏总额（冗余） */
  tipAmount: number
  /** 悬赏金额；null 表示非悬赏帖。列表徽章靠本列渲染 */
  bountyAmount: number | null
  /** 悬赏状态：escrow(托管中) | settled(已采纳) | refunded(已退款)；null 表示非悬赏帖。列表筛选用 */
  bountyStatus: 'escrow' | 'settled' | 'refunded' | null
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
  /** 被采纳的回答评论 ID（悬赏帖；详情接口从 Bounty 权威源返回，用于采纳置顶）[1.5][3.5] */
  bountyAcceptedCommentId?: number | null
  /** 悬赏到期时间（托管中，详情接口从 Bounty 权威源返回，横幅倒计时用）[3.5] */
  bountyExpireAt?: string | null
  /** Bounty 账本记录 ID（详情接口返回；采纳/取消端点用 Bounty.id 而非 post id）[3.5] */
  bountyId?: number | null
}

/** 评论项（与后端 CommentItem 对齐） */
export interface CommentItem {
  id: number
  content: string
  postId: number
  parentId: number | null
  floor: number | null
  likeCount: number
  /** 打赏人数（冗余；评论区轻量展示 🍗 N） */
  tipCount: number
  /** 打赏总额（冗余） */
  tipAmount: number
  author: AuthorBrief
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
  /** 装饰生效槽（可选；后端返回则用户名可着色，未返回时 UsernameText 走默认色） */
  decorColorValue?: string | null
  decorColorExpireAt?: string | null
  decorTitleValue?: string | null
  decorTitleStyle?: string | null
  decorTitleExpireAt?: string | null
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
  // ── 装饰生效槽（消费体系；购买时从 ShopItem 快照而来，商品事后改动不影响已持有 [1.3.3]）──
  /** 生效中的用户名颜色渲染值；null 或已过期则不上色 */
  decorColorValue: string | null
  /** 用户名颜色到期时间，ISO 8601 */
  decorColorExpireAt: string | null
  /** 生效中的专属称号文本 */
  decorTitleValue: string | null
  /** 称号徽章配色 key（amber | violet | emerald …） */
  decorTitleStyle: string | null
  /** 称号到期时间，ISO 8601 */
  decorTitleExpireAt: string | null
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
  // ── 装饰生效槽（后端 /api/users/:id 返回，随作者信息全站下发）──
  /** 生效中的用户名颜色渲染值；null 或已过期则不上色 */
  decorColorValue: string | null
  /** 用户名颜色到期时间，ISO 8601 */
  decorColorExpireAt: string | null
  /** 生效中的专属称号文本 */
  decorTitleValue: string | null
  /** 称号徽章配色 key（amber | violet | emerald …） */
  decorTitleStyle: string | null
  /** 称号到期时间，ISO 8601 */
  decorTitleExpireAt: string | null
}

/** 积分来源中文名映射（与后端 PointLog.type 对齐）。
 * 收入侧（earnPoints）：签到/发帖/评论/被赞；消费侧（spendPoints）：商城/补签/改名/扩容/打赏/悬赏托管；
 * 转入侧（creditPoints）：打赏收入/悬赏奖励/悬赏退款。消费与转入不触碰累计 [R44][R50]。 */
export const PointTypeLabel: Record<string, string> = {
  // ── 收入侧（存量）──
  checkin: '签到',
  post: '发帖',
  comment: '评论',
  liked: '被点赞',
  transfer: '管理调整',
  // ── 消费侧（扣余额）──
  shop: '装饰购买',
  makeup: '补签',
  rename: '改名',
  quota: '上传扩容',
  tip_out: '打赏',
  bounty_out: '悬赏托管',
  // ── 转入侧（只加余额）──
  tip_in: '收到打赏',
  bounty_in: '悬赏奖励',
  bounty_refund: '悬赏退款',
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

/** 商城配置（GET /api/config/game → shop，后台直写 Redis） */
export interface ShopConfig {
  /** 装饰默认时效天数（默认 30；商品级 durationDays 优先） */
  defaultDurationDays: number
  /** 到期前 N 天商城横幅提醒（默认 3）[1.3.4] */
  remindDays: number
}

/** 悬赏配置（GET /api/config/game → bounty） */
export interface BountyConfig {
  /** 手续费率（默认 0.1，采纳时扣 10% 销毁） */
  feeRate: number
  /** 超时天数（默认 7，之后自动判给最高赞回答）[1.6.3] */
  timeoutDays: number
  /** 悬赏金额下限 */
  amountMin: number
  /** 悬赏金额上限 */
  amountMax: number
  /** 发起门槛：累计鸡腿下限 */
  minTotalEarned: number
  /** 发起门槛：注册天数下限 */
  minRegisterDays: number
  /** 单用户同时进行中悬赏数上限 */
  maxActivePerUser: number
}

/** 游戏化配置（GET /api/config/game 响应） */
export interface GameConfig {
  checkin: CheckinConfig
  levels: LevelConfig[]
  /** 商城配置 */
  shop: ShopConfig
  /** 打赏配置（档位/自定义区间） */
  tip: TipConfig
  /** 悬赏配置 */
  bounty: BountyConfig
  /** 功能道具配置 */
  props: PropsConfig
}

// ── 收藏 / 关注 / 通知（关系链） ──

/** 收藏列表项（GET /api/me/bookmarks，与后端 BookmarkItem 对齐） */
export interface BookmarkItem {
  /** 收藏时间，ISO 8601 */
  bookmarkedAt: string
  /** 帖子摘要（与帖子列表同一结构） */
  post: PostListItem
}

/** 关注/粉丝列表项（与后端 FollowUserItem 对齐；后端用 AUTHOR_SELECT，含装饰槽） */
export interface FollowUserItem {
  id: number
  username: string
  avatar: string | null
  level: string
  decorColorValue?: string | null
  decorColorExpireAt?: string | null
  decorTitleValue?: string | null
  decorTitleStyle?: string | null
  decorTitleExpireAt?: string | null
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
  // ── 消费体系通知类型（设计文档 2.3 扩展；renderText 有专属模板，此处作兜底）──
  tip: '打赏了你',
  bounty_reply: '回答了你的悬赏帖',
  bounty_settled: '悬赏已结算',
  bounty_refunded: '悬赏已退款',
}

// ── 积分消费体系：装饰商城 / 打赏 / 悬赏 / 道具 ──

/** 装饰类型：同类互相覆盖、不同类共存（单槽模型）[1.3.3] */
export const ShopItemType = {
  /** 用户名颜色 */
  USERNAME_COLOR: 'username_color',
  /** 专属称号 */
  TITLE: 'title',
  /** 头像（付费租用覆盖基础头像） */
  AVATAR: 'avatar',
} as const
export type ShopItemTypeValue = (typeof ShopItemType)[keyof typeof ShopItemType]

/** 装饰类型中文名 */
export const ShopItemTypeLabel: Record<ShopItemTypeValue, string> = {
  [ShopItemType.USERNAME_COLOR]: '用户名颜色',
  [ShopItemType.TITLE]: '专属称号',
  [ShopItemType.AVATAR]: '头像',
}

/** 装饰商品（与后端 ShopItem 对齐，GET /api/shop/items） */
export interface ShopItem {
  /** 商品 ID */
  id: number
  /** 装饰类型：username_color | title */
  type: ShopItemTypeValue
  /** 商品名（前台展示，如「幻紫」） */
  name: string
  /** 渲染值：颜色类为 CSS 色值；称号类为图片索引（/images/title-icons/ 下的 webp 文件名主干） */
  renderValue: string
  /** 附加样式 key（已废弃，恒为 null；称号改由图片索引承载视觉） */
  renderStyle: string | null
  /** 价格（鸡腿） */
  price: number
  /** 时效天数（入门色 7 / 精选色与称号 30）[1.7] */
  durationDays: number
}

/** 临近到期装饰（GET /api/shop/items 返回的 expiringSoon[]，顶栏小黄点/商城横幅用）[1.3.4] */
export interface ShopExpiringItem {
  /** 持有记录 ID */
  id: number
  /** 装饰类型 */
  type: ShopItemTypeValue
  /** 持有的渲染值快照 */
  renderValue: string
  /** 到期时间，ISO 8601 */
  expireAt: string
  /** 距到期天数 */
  daysLeft: number
}

/** 我的装饰持有项（GET /api/shop/mine；含过期项，置灰 + 一键续费）[1.3.4] */
export interface MyDecorationItem {
  /** 持有记录 ID */
  id: number
  /** 商品 ID（续费跳回商品） */
  itemId: number
  /** 装饰类型 */
  type: ShopItemTypeValue
  /** 商品名（后端 shop_items.name：称号中文名 / 颜色中文名 / 头像「风格-NN」） */
  name: string
  /** 购买时快照的渲染值 */
  renderValue: string
  /** 快照的样式 key */
  renderStyle: string | null
  /** 实付价格快照 */
  price: number
  /** 本次生效起始时间，ISO 8601 */
  startAt: string
  /** 到期时间，ISO 8601；过期记录不删除，置灰展示 */
  expireAt: string
  /** 是否仍在生效期内（过期则置灰 + 可续费）[R46] */
  active: boolean
  /** 是否为当前佩戴的装饰（与用户生效槽一致）；仅 active 时才有意义 */
  worn: boolean
}

/** 我的装饰分组（按 type 分组，颜色/称号两个 tab 或两段） */
export interface MyDecorationGroup {
  /** 装饰类型 */
  type: ShopItemTypeValue
  /** 该类型下全部持有项（含过期，按到期倒序） */
  items: MyDecorationItem[]
}

/** 悬赏状态（与后端 Bounty.status 对齐；Post.bountyStatus 冗余同义） */
export const BountyStatus = {
  /** 托管中（发起时金额已扣，等待采纳） */
  ESCROW: 'escrow',
  /** 已采纳（含超时自动判给最高赞） */
  SETTLED: 'settled',
  /** 已退款（零有效回答 / 发起人取消 / 后台处置） */
  REFUNDED: 'refunded',
} as const
export type BountyStatusValue = (typeof BountyStatus)[keyof typeof BountyStatus]

/** 悬赏状态中文名 */
export const BountyStatusLabel: Record<BountyStatusValue, string> = {
  [BountyStatus.ESCROW]: '托管中',
  [BountyStatus.SETTLED]: '已采纳',
  [BountyStatus.REFUNDED]: '已退款',
}

/** 称号徽章配色 key → Tailwind class（UsernameText 按 renderStyle 取，未命中回退默认灰） */
export const DecorationStyle: Record<string, string> = {
  amber: 'bg-amber-500/15 text-amber-600',
  violet: 'bg-violet-500/15 text-violet-600',
  emerald: 'bg-emerald-500/15 text-emerald-600',
}

/** 打赏记录项（GET /api/posts/:id/tips 等，打赏者明细公开）[1.5.3] */
export interface TipItem {
  /** 打赏记录 ID */
  id: number
  /** 打赏金额（鸡腿） */
  amount: number
  /** 打赏留言，最长 20 字，选填 */
  message: string | null
  /** 打赏时间，ISO 8601 */
  createdAt: string
  /** 打赏者（公开头像/留言/金额，不做匿名） */
  fromUser: AuthorBrief
}

/** 打赏者列表结果（GET /api/posts/:id/tips） */
export interface PostTipsResult {
  items: TipItem[]
  /** 打赏人数（因 [R48] 一人一次，人数 = 笔数，无需去重） */
  total: number
  /** 打赏总额 */
  totalAmount: number
}

/** 采纳回答结果（POST /api/bounties/:id/accept） */
export interface BountyAcceptResult {
  /** 实发金额 = 托管金额 − 手续费 */
  payout: number
}

/** 打赏档位配置（GET /api/config/game → tip） */
export interface TipConfig {
  /** 快捷档位金额（默认 [6,66,188]） */
  amounts: number[]
  /** 自定义打赏下限 */
  customMin: number
  /** 自定义打赏上限 */
  customMax: number
}

/** 道具配置（GET /api/config/game → props；quota 相关单位为字节） */
export interface PropsConfig {
  /** 补签价格（默认 80） */
  makeupPrice: number
  /** 每月补签次数上限（默认 3） */
  makeupMonthlyLimit: number
  /** 改名价格（默认 200） */
  renamePrice: number
  /** 改名冷却天数（默认 30） */
  renameCooldownDays: number
  /** 单次扩容增加字节数（默认 10MB） */
  quotaPerPurchase: number
  /** 扩容价格（默认 150） */
  quotaPrice: number
  /** 扩容累计上限字节数（默认 500MB） */
  quotaTotalLimit: number
}
