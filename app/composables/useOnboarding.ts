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
      // 只保留导航按钮，不显示右上角的关闭 X
      showButtons: ['next', 'previous'],
      nextBtnText: '下一步 →',
      prevBtnText: '← 上一步',
      doneBtnText: '完成 ✓',
      progressText: '第 {{current}} 步，共 {{total}} 步',
      animate: true,
      smoothScroll: true,
      disableActiveInteraction: false,
      // 禁止点击关闭，只能通过按钮操作
      allowClose: false,
      stagePadding: 10,
      stageRadius: 10,
      popoverClass: 'onboarding-popover',
      // 完全隐藏遮罩层
      overlayOpacity: 0,
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
            // 直接销毁 driver 实例
            if (driverInstance.value) {
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
          title: '👋 嗨，欢迎来到 AI Base！',
          description: '我们是一个 AI 技术爱好者的交流社区\n\n这里有 1000+ 小伙伴在分享最新的 AI 技术和经验\n每天都有新鲜的讨论，签到和发帖还能赚积分换装扮\n\n花 30 秒带你转一圈 😊',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: 'aside:first-of-type',
        popover: {
          title: '📚 这里是内容分类',
          description: '想看什么主题？点左边的分类就能快速找到\n\nAI 工具、大模型、提示词...都给你分好类了',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'main',
        popover: {
          title: '📝 这是内容区',
          description: '所有帖子都在这里展示\n\n看到喜欢的就点进去，还可以点赞、评论\n遇到特别好的内容，别忘了打赏支持作者哦',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: 'aside:last-of-type',
        popover: {
          title: '🔥 热门推荐',
          description: '右边是热门帖子和新来的小伙伴\n\n想快速找到优质内容？看这里就对了',
          side: 'left',
          align: 'start',
        },
      },
      {
        popover: {
          title: '🍗 关于积分系统',
          description: '我们用鸡腿作为积分（是不是很可爱？）\n\n• 每天签到可以领 5-20 个鸡腿\n• 发帖、评论也能赚鸡腿\n• 用鸡腿可以买装扮、打赏别人、发悬赏帖\n\n连续签到还有加成，别忘了每天来打卡哦！',
          side: 'top',
          align: 'center',
        },
      },
      {
        popover: {
          title: '🚀 准备好了吗？',
          description: '基本操作就是这些啦！\n\n接下来你可以：\n📅 去签到页领新手积分\n🔥 浏览热门帖子看看大家在聊什么\n✍️ 发布你的第一篇帖子\n\n祝你在 AI Base 玩得开心 🎉',
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

        // 最后一步：自然结束，不打断用户
        if (currentIndex === 5) {
          driverObj.destroy()
          // 引导自然结束，用户可以自由探索
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
          title: '👋 嗨，欢迎来到 AI Base！',
          description: '我们是 AI 技术爱好者的小天地\n\n每天都有小伙伴在分享最新的技术和经验\n签到发帖能赚积分，还能换装扮\n\n20 秒带你快速上手 😊',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: 'nav[aria-label="移动端主导航"]',
        popover: {
          title: '📱 底部导航栏',
          description: '首页看帖子、发帖分享、商店换装扮、个人中心\n\n所有核心功能都在这里，轻轻一点就能用',
          side: 'top',
          align: 'center',
        },
      },
      {
        popover: {
          title: '🍗 积分怎么玩？',
          description: '我们用鸡腿当积分（可爱吧）\n\n• 每天签到领 5-20 个鸡腿\n• 发帖评论也能赚\n• 用鸡腿买装扮、打赏、发悬赏\n\n连续签到有加成哦！',
          side: 'top',
          align: 'center',
        },
      },
      {
        popover: {
          title: '🚀 开始玩吧！',
          description: '基本操作就这些啦\n\n📅 去签到领新手积分\n🔥 逛逛热门帖子\n✍️ 发你的第一篇帖子\n\n祝你玩得开心 🎉',
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

        // 最后一步：自然结束，不打断用户
        if (currentIndex === 3) {
          driverObj.destroy()
          // 引导自然结束，用户可以自由探索
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
