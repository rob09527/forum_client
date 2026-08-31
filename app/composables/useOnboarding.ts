import { driver } from 'driver.js'
import type { DriveStep, Driver, Config } from 'driver.js'

/**
 * 引导类型
 */
export type OnboardingType = 'welcome' | 'first-post' | 'first-checkin'

/**
 * 引导状态存储键
 */
const STORAGE_KEY = 'forum_onboarding_completed'

/**
 * 检测设备类型
 */
function isMobile(): boolean {
  if (import.meta.server) return false
  return window.innerWidth < 1024 // lg breakpoint
}

/**
 * 新手引导系统
 *
 * 职责:
 * - 管理引导状态(LocalStorage)
 * - 创建和启动引导流程
 * - 提供预定义的引导场景
 * - 区分电脑端/手机端提供不同引导流程
 */
export function useOnboarding() {
  const driverInstance = ref<Driver | null>(null)

  /**
   * 获取已完成的引导列表
   */
  function getCompletedOnboarding(): OnboardingType[] {
    if (import.meta.server) return []

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    try {
      return JSON.parse(stored) as OnboardingType[]
    } catch {
      return []
    }
  }

  /**
   * 标记引导为已完成
   */
  function markAsCompleted(type: OnboardingType) {
    if (import.meta.server) return

    const completed = getCompletedOnboarding()
    if (!completed.includes(type)) {
      completed.push(type)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed))
    }
  }

  /**
   * 检查引导是否已完成
   */
  function isCompleted(type: OnboardingType): boolean {
    return getCompletedOnboarding().includes(type)
  }

  /**
   * 重置所有引导(用于测试)
   */
  function resetAll() {
    if (import.meta.server) return
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * 创建 driver 实例
   */
  function createDriver(config?: Partial<Config>): Driver {
    const defaultConfig: Config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '完成',
      progressText: '{{current}} / {{total}}',
      animate: true,
      smoothScroll: true,
      disableActiveInteraction: false,
      allowClose: true,
      stagePadding: 10,
      stageRadius: 10,
      popoverClass: 'onboarding-popover',
      ...config,
    }

    return driver(defaultConfig)
  }

  /**
   * 启动引导流程
   */
  function startTour(type: OnboardingType, steps: DriveStep[], config?: Partial<Config>) {
    if (import.meta.server) return
    if (isCompleted(type)) return

    const driverObj = createDriver({
      ...config,
      onDestroyed: (element, step, opts) => {
        markAsCompleted(type)
        config?.onDestroyed?.(element, step, opts)
      },
    })

    driverObj.setSteps(steps)
    driverObj.drive(0)
    driverInstance.value = driverObj
  }

  /**
   * 预定义引导: 首次登录欢迎（多页面引导，区分桌面端/移动端）
   */
  function startWelcomeTour() {
    if (import.meta.server) return
    if (isCompleted('welcome')) return

    // 根据设备类型选择不同的引导流程
    if (isMobile()) {
      startWelcomeTourMobile()
    } else {
      startWelcomeTourDesktop()
    }
  }

  /**
   * 桌面端欢迎引导（更详细，展示顶部导航和功能）
   */
  function startWelcomeTourDesktop() {
    const welcomeStep: DriveStep = {
      popover: {
        title: '欢迎来到 AI Base 论坛 🎉',
        description: '这是一个专注于 AI 技术交流的社区。接下来，我将带你快速了解核心功能。点击"下一步"开始！',
        side: 'bottom',
        align: 'center',
      },
    }

    const driverObj = createDriver({
      onDestroyed: (element, step, opts) => {
        markAsCompleted('welcome')
        const goToCheckin = confirm('引导完成！是否前往签到页领取新手积分？')
        if (goToCheckin) {
          navigateTo('/checkin')
        }
      },
      onNextClick: (element, step, opts) => {
        const currentIndex = opts.index ?? 0

        if (currentIndex === 0) {
          // 跳转到签到页
          driverObj.destroy()
          navigateTo('/checkin')
          setTimeout(() => {
            startWelcomeTourDesktopStep2()
          }, 1000)
        } else {
          driverObj.moveNext()
        }
      },
    })

    driverObj.setSteps([welcomeStep])
    driverObj.drive(0)
    driverInstance.value = driverObj
  }

  /**
   * 桌面端 - 第2步：签到页
   */
  function startWelcomeTourDesktopStep2() {
    const steps: DriveStep[] = [
      {
        element: '[data-onboarding="checkin-button"]',
        popover: {
          title: '每日签到 📅',
          description: '每天签到可获得积分奖励(鸡腿🍗)。连续签到还有额外加成！',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        popover: {
          title: '积分用途 🍗',
          description: '积分可用于购买装扮、称号、头像框，打赏优质内容，发布悬赏帖等。现在去看看商店吧！',
        },
      },
    ]

    const driverObj = createDriver({
      onNextClick: (element, step, opts) => {
        const currentIndex = opts.index ?? 0
        if (currentIndex === 1) {
          // 跳转到商店
          driverObj.destroy()
          navigateTo('/shop')
          setTimeout(() => {
            startWelcomeTourDesktopStep3()
          }, 1000)
        } else {
          driverObj.moveNext()
        }
      },
      onCloseClick: () => {
        markAsCompleted('welcome')
      },
    })

    driverObj.setSteps(steps)
    driverObj.drive(0)
  }

  /**
   * 桌面端 - 第3步：商店页
   */
  function startWelcomeTourDesktopStep3() {
    const step: DriveStep = {
      popover: {
        title: '积分商城 🛍️',
        description: '这里可以用积分购买各种装扮：昵称颜色、称号、头像框等，让你的个人主页与众不同。现在去发布第一篇帖子吧！',
        side: 'top',
        align: 'center',
      },
    }

    const driverObj = createDriver({
      onNextClick: (element, step, opts) => {
        driverObj.destroy()
        navigateTo('/post/new')
        setTimeout(() => {
          startWelcomeTourDesktopStep4()
        }, 1000)
      },
      onCloseClick: () => {
        markAsCompleted('welcome')
      },
    })

    driverObj.setSteps([step])
    driverObj.drive(0)
  }

  /**
   * 桌面端 - 第4步：发帖页
   */
  function startWelcomeTourDesktopStep4() {
    const step: DriveStep = {
      element: '[data-onboarding="post-title"]',
      popover: {
        title: '发布内容 ✍️',
        description: '分享你的想法、提问或经验。发帖可获得积分奖励！支持 Markdown 格式，可以插入代码、图片等。',
        side: 'bottom',
        align: 'start',
      },
    }

    const driverObj = createDriver({
      onDestroyed: (element, step, opts) => {
        markAsCompleted('welcome')
        const goBack = confirm('引导完成！现在你可以开始探索论坛了。是否返回首页？')
        if (goBack) {
          navigateTo('/')
        }
      },
    })

    driverObj.setSteps([step])
    driverObj.drive(0)
  }

  /**
   * 移动端欢迎引导（简化流程，聚焦底部导航）
   */
  function startWelcomeTourMobile() {
    const steps: DriveStep[] = [
      {
        popover: {
          title: '欢迎来到 AI Base 论坛 🎉',
          description: '这是一个专注于 AI 技术交流的社区。让我带你快速了解核心功能！',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-onboarding="nav-home"]',
        popover: {
          title: '首页',
          description: '浏览最新、最热的帖子，发现感兴趣的内容。',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-onboarding="nav-categories"]',
        popover: {
          title: '分类',
          description: '按照主题分类浏览内容，找到你感兴趣的板块。',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-onboarding="nav-post"]',
        popover: {
          title: '发帖',
          description: '分享你的想法、问题或经验。发帖可获得积分奖励！',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-onboarding="nav-shop"]',
        popover: {
          title: '商店',
          description: '用积分购买装扮：昵称颜色、称号、头像框等。',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-onboarding="nav-user"]',
        popover: {
          title: '个人中心',
          description: '查看你的帖子、积分、装扮和设置。',
          side: 'top',
          align: 'end',
        },
      },
      {
        popover: {
          title: '每日签到 📅',
          description: '记得每天签到领取积分！通过签到、发帖、评论可以获得鸡腿🍗，用于购买装扮和打赏他人。',
        },
      },
      {
        popover: {
          title: '开始你的旅程 🚀',
          description: '现在你可以开始探索了！点击"签到"按钮去领取新手积分吧！',
        },
      },
    ]

    const driverObj = createDriver({
      onDestroyed: (element, step, opts) => {
        markAsCompleted('welcome')
        const goToCheckin = confirm('是否前往签到页领取新手积分？')
        if (goToCheckin) {
          navigateTo('/checkin')
        }
      },
    })

    driverObj.setSteps(steps)
    driverObj.drive(0)
    driverInstance.value = driverObj
  }

  /**
   * 预定义引导: 首次发帖
   */
  function startFirstPostTour() {
    const steps: DriveStep[] = [
      {
        element: '[data-onboarding="post-title"]',
        popover: {
          title: '标题',
          description: '给你的帖子起一个清晰的标题，让其他人一眼就能了解内容。',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-onboarding="post-category"]',
        popover: {
          title: '选择分类',
          description: '选择合适的分类，帮助其他人更容易找到你的帖子。',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-onboarding="post-editor"]',
        popover: {
          title: 'Markdown 编辑器 ✍️',
          description: '支持 Markdown 语法，可以插入代码、图片、表格等。使用工具栏快速插入格式。',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-onboarding="editor-toolbar"]',
        popover: {
          title: '编辑器工具栏',
          description: '快速插入标题、列表、代码块、图片等。试试彩色文字和表情功能！',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-onboarding="post-tags"]',
        popover: {
          title: '添加标签(可选)',
          description: '添加相关标签，方便其他人搜索和发现你的帖子。',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-onboarding="post-submit"]',
        popover: {
          title: '发布',
          description: '内容写好后，点击发布按钮。发布成功后可获得积分奖励！',
          side: 'top',
          align: 'end',
        },
      },
      {
        popover: {
          title: '小贴士 💡',
          description: '优质内容可能会被版主加精，获得额外的星辰奖励。记得使用 Markdown 让你的帖子更美观！',
        },
      },
    ]

    startTour('first-post', steps)
  }

  /**
   * 预定义引导: 首次签到
   */
  function startFirstCheckinTour() {
    const steps: DriveStep[] = [
      {
        element: '[data-onboarding="checkin-button"]',
        popover: {
          title: '每日签到 📅',
          description: '点击按钮即可签到，每次签到可获得积分奖励。',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-onboarding="checkin-streak"]',
        popover: {
          title: '连续签到加成',
          description: '连续签到可获得额外加成！连续 7 天、30 天、100 天都有特殊奖励。',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-onboarding="checkin-rules"]',
        popover: {
          title: '签到规则',
          description: '基础签到奖励 5 鸡腿，连续签到有加成。每日上限 20 鸡腿，记得每天来签到哦！',
          side: 'top',
          align: 'start',
        },
      },
      {
        popover: {
          title: '积分用途',
          description: '积分可用于：装扮昵称(彩色文字)、购买称号、购买头像框、打赏他人、发悬赏帖等。',
        },
      },
      {
        popover: {
          title: '补签功能',
          description: '如果断签了，可以使用积分补签，保持连续签到记录。补签功能在个人中心可以找到。',
        },
      },
    ]

    startTour('first-checkin', steps)
  }

  /**
   * 销毁当前引导
   */
  function destroy() {
    if (driverInstance.value) {
      driverInstance.value.destroy()
      driverInstance.value = null
    }
  }

  return {
    isCompleted,
    markAsCompleted,
    resetAll,
    startTour,
    startWelcomeTour,
    startFirstPostTour,
    startFirstCheckinTour,
    destroy,
  }
}
