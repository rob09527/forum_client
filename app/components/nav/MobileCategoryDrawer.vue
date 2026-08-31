<template>
  <!-- 移动端左侧板块抽屉：顶栏汉堡打开（lg:hidden，桌面不渲染）。
       Teleport 到 body + 遮罩；受 useAppLayout().leftDrawerOpen 控制。
       抽屉内容复用 CategoryList（与桌面 LeftSidebar 同源）+ 签到卡。 -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="leftDrawerOpen" class="lg:hidden fixed inset-0 z-[90]">
        <!-- 遮罩：点击关闭 -->
        <div class="absolute inset-0 bg-black/50" aria-hidden="true" @click="close" />
        <!-- 抽屉主体 -->
        <aside class="absolute left-0 top-0 bottom-0 w-64 max-w-[80vw] bg-white shadow-xl flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-4 h-12 shrink-0 border-b border-zinc-100">
            <span class="text-sm font-semibold text-zinc-800">板块</span>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="关闭"
              @click="close"
            >
              <AppIcon name="x" :size="16" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-3 py-4">
            <CategoryList
              :categories="categories"
              :active-category="activeCategory"
              @select-category="handleSelect"
            />
            <div class="mt-4">
              <CheckinCard />
            </div>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Category } from '~/types'

defineProps<{
  categories: Category[]
  activeCategory: string
}>()

const emit = defineEmits<{
  'select-category': [slug: string]
}>()

const { leftDrawerOpen, toggleLeftDrawer } = useAppLayout()

function close() {
  if (leftDrawerOpen.value) toggleLeftDrawer()
}

/** 选中板块：先收起抽屉，再派发切换（default.vue 负责改 URL） */
function handleSelect(slug: string) {
  close()
  emit('select-category', slug)
}

// 打开期间锁定 body 滚动 + Esc 关闭（DOM API 需客户端；抽屉仅由用户点击打开，SSR 恒 false 无 hydration 差异）
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
watch(leftDrawerOpen, (open) => {
  if (open) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-enter-active aside,
.drawer-leave-active aside {
  transition: transform 0.2s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from aside,
.drawer-leave-to aside {
  transform: translateX(-100%);
}
</style>
