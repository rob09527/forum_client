import { ref, computed } from 'vue'

/**
 * 引导类型
 */
export type OnboardingType = 'welcome' | 'first-post' | 'first-checkin'

/**
 * 单个引导步骤。
 *
 * title / description 显示在引导卡片上；
 * target 是可选的关联元素选择器——存在且能找到时，给元素加高亮描边并尝试滚入视野，
 * 找不到也照常显示（引导卡片本身不依赖任何页面元素，天然抗页面变化）。
 */
export interface OnboardingStep {
  title: string
  description: string
  /** 关联元素选择器（可选） */
  target?: string
}

/** 引导状态存储键 */
const STORAGE_KEY = 'forum_onboarding_completed'

/* ---------------------------------- 全局单例状态 ----------------------------------
 * 模块级 ref 保证「触发方(default.vue/页面)」与「渲染方(OnboardingGuide.vue)」共享同一份状态。
 * 卡片是「非模态」的：无遮罩、不拦截点击、不强制停留，用户可随时自由操作页面。
 * -------------------------------------------------------------------------------- */
const activeTour = ref<OnboardingType | null>(null)
const activeSteps = ref<OnboardingStep[]>([])
const activeIndex = ref(0)

/**
 * 设备判定：宽 <1024，或 <1280 且支持触摸（平板），视为移动端。
 * 仅供选择 welcome 引导的步骤集使用。
 */
function isMobileDevice(): boolean {
  if (import.meta.server) return false
  const width = window.innerWidth
  const hasTouch = 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0
  return width < 1024 || (width < 1280 && hasTouch)
}

/** 桌面端欢迎引导：首页从上到下的功能巡礼 */
function desktopWelcomeSteps(): OnboardingStep[] {
  return [
    {
      title: '👋 嗨，欢迎来到 AI Base！',
      description:
        '我们是一个 AI 技术爱好者的交流社区\n\n这里有 1000+ 小伙伴在分享最新的 AI 技术和经验，签到和发帖还能赚积分换装扮。\n\n花 30 秒带你转一圈 😊',
    },
    {
      target: 'aside:first-of-type',
      title: '📚 左边是内容分类',
      description: '想看什么主题？点分类就能快速筛选。\n\nAI 工具、大模型、提示词……都给你分好类了。',
    },
    {
      target: 'main',
      title: '📝 中间是帖子列表',
      description: '大家都在这里发帖讨论。\n\n点进去看看，喜欢就点赞评论，遇到好内容也可以打赏支持作者。',
    },
    {
      target: 'aside:last-of-type',
      title: '🔥 右边是热门推荐',
      description: '想快速找到优质内容？\n\n右侧的热门帖子和最新用户，帮你发现大家都在看什么。',
    },
    {
      title: '🍗 积分（鸡腿）怎么玩？',
      description:
        '• 每天签到领 5-20 个鸡腿\n• 发帖、评论也能赚\n• 用鸡腿买装扮、打赏别人、发悬赏帖\n\n连续签到还有加成，记得常来打卡！',
    },
    {
      title: '🚀 都介绍完啦！',
      description:
        '接下来你可以：\n📅 去签到领新手积分\n🔥 逛逛热门帖子\n✍️ 发你的第一篇帖子\n\n祝你在 AI Base 玩得开心 🎉',
    },
  ]
}

/** 移动端欢迎引导：聚焦底部导航与核心玩法 */
function mobileWelcomeSteps(): OnboardingStep[] {
  return [
    {
      title: '👋 嗨，欢迎来到 AI Base！',
      description: '我们是 AI 技术爱好者的小天地\n\n每天都有小伙伴在分享最新的技术和经验，签到发帖能赚积分换装扮。\n\n20 秒带你快速上手 😊',
    },
    {
      target: 'nav[aria-label="移动端主导航"]',
      title: '📱 底部就是全部入口',
      description: '首页看帖、发帖分享、商店换装扮、个人中心，都在底部这一栏，点一下就能用。',
    },
    {
      title: '🍗 积分（鸡腿）怎么玩？',
      description:
        '• 每天签到领 5-20 个鸡腿\n• 发帖评论也能赚\n• 用鸡腿买装扮、打赏、发悬赏\n\n连续签到有加成哦！',
    },
    {
      title: '🚀 开始玩吧！',
      description: '📅 去签到领新手积分\n🔥 逛逛热门帖子\n✍️ 发你的第一篇帖子\n\n祝你玩得开心 🎉',
    },
  ]
}

/** 首次发帖引导 */
function firstPostSteps(): OnboardingStep[] {
  return [
    { target: '[data-onboarding="post-title"]', title: '✏️ 先起个标题', description: '清晰直白的标题，能让别人一眼就懂你的帖子讲什么。' },
    { target: '[data-onboarding="post-category"]', title: '📚 选个分类', description: '选对板块，同好更容易刷到你的内容。' },
    { target: '[data-onboarding="post-editor"]', title: '✍️ 用 Markdown 写正文', description: '支持代码块、图片、表格，工具栏一键插入，还能插彩色文字和表情。' },
    { target: '[data-onboarding="post-tags"]', title: '🏷️ 加几个标签', description: '标签方便别人搜索发现你的帖子，选填。' },
    { target: '[data-onboarding="post-submit"]', title: '🚀 发布', description: '写好了点发布，发帖能赚鸡腿积分。优质内容还可能被加精，拿星辰奖励哦！' },
  ]
}

/** 首次签到引导 */
function firstCheckinSteps(): OnboardingStep[] {
  return [
    { target: '[data-onboarding="checkin-button"]', title: '📅 点这里签到', description: '每天点一下签到按钮，就能领鸡腿积分。' },
    { target: '[data-onboarding="checkin-streak"]', title: '🔥 连续签到有加成', description: '连签 7 / 30 / 100 天都有额外奖励，断了也别慌，能用鸡腿补签。' },
    { title: '🍗 鸡腿都能干嘛？', description: '买彩色昵称、称号、头像框，给喜欢的帖子打赏，还能发悬赏帖请人帮忙。' },
  ]
}

/* ---------------------------------- 存储 ---------------------------------- */

function getCompleted(): OnboardingType[] {
  if (import.meta.server) return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as OnboardingType[]
  } catch {
    return []
  }
}

function markAsCompleted(type: OnboardingType) {
  if (import.meta.server) return
  const done = getCompleted()
  if (!done.includes(type)) {
    done.push(type)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(done))
  }
}

function isCompleted(type: OnboardingType): boolean {
  return getCompleted().includes(type)
}

/** 清空完成记录（调试用） */
function resetAll() {
  if (import.meta.server) return
  localStorage.removeItem(STORAGE_KEY)
}

/* ---------------------------------- 流程控制 ---------------------------------- */

/** 打开某类引导（已在展示中则忽略，避免重复叠加） */
function start(type: OnboardingType, steps: OnboardingStep[]) {
  if (import.meta.server) return
  if (isCompleted(type)) return
  if (activeTour.value) return // 已有引导卡片在展示，不叠开

  activeSteps.value = steps
  activeIndex.value = 0
  activeTour.value = type
}

function next() {
  if (activeIndex.value < activeSteps.value.length - 1) {
    activeIndex.value++
  } else {
    finish()
  }
}

function prev() {
  if (activeIndex.value > 0) activeIndex.value--
}

/**
 * 结束引导：标记为已完成并收起卡片。
 * 完成 / 跳过 / 右上角关闭都走这里——对用户而言都是「这次不用再看了」。
 */
function finish() {
  if (activeTour.value) markAsCompleted(activeTour.value)
  activeTour.value = null
  activeSteps.value = []
  activeIndex.value = 0
}

/** 对外兼容旧名的关闭入口 */
function destroy() {
  finish()
}

/* ---------------------------------- 导出入口 ---------------------------------- */

const currentStep = computed(() => activeSteps.value[activeIndex.value] ?? null)
const totalSteps = computed(() => activeSteps.value.length)
const progressText = computed(() =>
  totalSteps.value ? `${activeIndex.value + 1} / ${totalSteps.value}` : ''
)

/** 供 OnboardingGuide.vue 使用的响应式视图状态 */
const tourState = computed(() => {
  const step = currentStep.value
  const total = totalSteps.value
  const isLast = total > 0 && activeIndex.value === total - 1
  return {
    active: activeTour.value !== null,
    step,
    index: activeIndex.value,
    total,
    progress: progressText.value,
    isLast,
    isFirst: activeIndex.value === 0,
  }
})

export function useOnboarding() {
  return {
    // 视图状态
    tourState,
    // 启动
    startWelcomeTour: () => {
      if (import.meta.server) return
      if (isCompleted('welcome')) return
      start('welcome', isMobileDevice() ? mobileWelcomeSteps() : desktopWelcomeSteps())
    },
    startFirstPostTour: () => start('first-post', firstPostSteps()),
    startFirstCheckinTour: () => start('first-checkin', firstCheckinSteps()),
    // 控制
    next,
    prev,
    finish,
    destroy,
    // 存储
    isCompleted,
    markAsCompleted,
    resetAll,
  }
}
