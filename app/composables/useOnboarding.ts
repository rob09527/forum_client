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
 * 结合屏幕宽度和触摸能力判断，更准确识别平板等边缘设备
 */
function isMobile(): boolean {
  if (import.meta.server) return false

  const width = window.innerWidth
  const hasTouch = 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0

  // 小于 1024px 认为是移动端
  // 或者 1024-1280px 之间但是触摸设备（平板）
  return width < 1024 || (width < 1280 && hasTouch)
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
      nextBtnText: '下一步 →',
      prevBtnText: '← 上一步',
      doneBtnText: '完成 ✓',
      progressText: '第 {{current}} 步，共 {{total}} 步',
      animate: true,
      smoothScroll: true,
      disableActiveInteraction: false,
      allowClose: true,
      stagePadding: 10,
      stageRadius: 10,
      popoverClass: 'onboarding-popover',
      // 不使用遮罩层，更轻量友好
      showOverlay: false,
      onPopoverRender: (popover, { config: driverConfig, state }) => {
        // 添加跳过按钮
        const footer = popover.wrapper.querySelector('.driver-popover-footer')
        if (footer && !footer.querySelector('.driver-popover-skip-btn')) {
          const skipBtn = document.createElement('button')
          skipBtn.className = 'driver-popover-skip-btn'
          skipBtn.textContent = '跳过引导'
          skipBtn.style.cssText = 'margin-right: auto; padding: 5px 10px; color: #71717a; font-size: 13px; background: transparent; border: none; cursor: pointer; transition: color 0.2s;'
          skipBtn.onmouseover = () => { skipBtn.style.color = '#18181b' }
          skipBtn.onmouseout = () => { skipBtn.style.color = '#71717a' }
          skipBtn.onclick = () => {
            const shouldSkip = confirm('确定跳过新手引导吗？\n\n你可以稍后在个人设置中重新查看引导。')
            if (shouldSkip && driverInstance.value) {
              driverInstance.value.destroy()
            }
          }
          footer.prepend(skipBtn)
        }
      },
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
   * 桌面端欢迎引导（单页版本，在首页完成所有引导）
   */
  function startWelcomeTourDesktop() {
    const steps: DriveStep[] = [
      {
        element: 'header',
        popover: {
          title: '欢迎来到 AI Base 论坛 🎉',
          description: '这里是 AI 技术爱好者的交流社区\n\n• 1000+ 活跃用户分享经验\n• 每天都有新鲜的技术讨论\n• 签到/发帖获得积分，兑换专属装扮\n\n让我们用 30 秒带你快速上手！',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: 'aside:first-of-type',
        popover: {
          title: '内容分类 📚',
          description: '左侧是板块分类，点击找到你感兴趣的主题，精准浏览相关内容。',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'main',
        popover: {
          title: '内容区域 📝',
          description: '这里展示最新和最热的帖子。点击标题查看详情，可以点赞、评论和打赏优质内容。',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: 'aside:last-of-type',
        popover: {
          title: '发现更多 🔥',
          description: '右侧边栏展示热门帖子和最新用户，帮助你快速发现感兴趣的内容。',
          side: 'left',
          align: 'start',
        },
      },
      {
        popover: {
          title: '积分系统 🍗',
          description: '• 每日签到：获得 5-20 鸡腿\n• 发帖/评论：内容越优质奖励越多\n• 积分用途：购买装扮、打赏作者、发悬赏帖\n\n连续签到还有额外加成！',
          side: 'top',
          align: 'center',
        },
      },
      {
        popover: {
          title: '开始你的旅程 🚀',
          description: '你已经掌握了基本操作！现在可以：\n\n📅 去签到领取新手积分\n🔥 浏览热门帖子\n✍️ 发布你的第一篇帖子',
          side: 'top',
          align: 'center',
        },
      },
    ]

    const driverObj = createDriver({
      onDestroyed: (element, step, opts) => {
        markAsCompleted('welcome')
      },
      onNextClick: (element, step, opts) => {
        const currentIndex = opts.index ?? 0

        // 最后一步：提供行动选项
        if (currentIndex === 5) {
          driverObj.destroy()

          // 使用更友好的方式提示用户
          const action = confirm('🎉 新手引导完成！\n\n点击"确定"前往签到领积分\n点击"取消"继续浏览')
          if (action) {
            navigateTo('/checkin')
          }
        } else {
          driverObj.moveNext()
        }
      },
    })

    driverObj.setSteps(steps)
    driverObj.drive(0)
    driverInstance.value = driverObj
  }

  /**
   * 移动端欢迎引导（简化为 4 步，聚焦核心价值）
   */
  function startWelcomeTourMobile() {
    const steps: DriveStep[] = [
      {
        popover: {
          title: '欢迎来到 AI Base 论坛 🎉',
          description: '这里是 AI 技术爱好者的交流社区\n\n• 每天都有新鲜的技术讨论\n• 签到/发帖获得积分奖励\n• 用积分兑换专属装扮\n\n让我们用 20 秒带你快速上手！',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: 'nav[aria-label="移动端主导航"]',
        popover: {
          title: '底部导航 📱',
          description: '首页浏览内容、发帖分享想法、商店兑换装扮、个人中心查看资料。所有核心功能都在这里！',
          side: 'top',
          align: 'center',
        },
      },
      {
        popover: {
          title: '积分系统 🍗',
          description: '• 每日签到：获得 5-20 鸡腿\n• 发帖/评论：内容越优质奖励越多\n• 积分用途：购买装扮、打赏作者、发悬赏帖\n\n连续签到还有额外加成哦！',
          side: 'top',
          align: 'center',
        },
      },
      {
        popover: {
          title: '开始探索吧 🚀',
          description: '你已经掌握了基本操作！现在可以：\n\n📅 去签到领取新手积分\n🔥 浏览热门帖子\n✍️ 发布你的第一篇帖子',
          side: 'top',
          align: 'center',
        },
      },
    ]

    const driverObj = createDriver({
      onDestroyed: (element, step, opts) => {
        markAsCompleted('welcome')
      },
      onNextClick: (element, step, opts) => {
        const currentIndex = opts.index ?? 0

        // 最后一步：提供行动选项
        if (currentIndex === 3) {
          driverObj.destroy()

          // 使用更友好的方式提示用户
          const action = confirm('🎉 新手引导完成！\n\n点击"确定"前往签到领积分\n点击"取消"继续浏览')
          if (action) {
            navigateTo('/checkin')
          }
        } else {
          driverObj.moveNext()
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
