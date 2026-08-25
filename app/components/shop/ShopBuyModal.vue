<template>
  <AppModal
    :model-value="modelValue"
    :title="item ? `购买「${item.name}」` : '购买装饰'"
    width="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="item">
      <!-- 试戴预览 [1.3.3]：真实用户名 + 待购效果 -->
      <ShopPreview :item="item" />

      <!-- 购买信息 -->
      <div class="mt-4 space-y-1.5 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-zinc-500">价格</span>
          <span class="font-medium text-amber-600">🍗 {{ item.price }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-zinc-500">时效</span>
          <span class="text-zinc-700">{{ item.durationDays }} 天</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-zinc-500">扣款后剩余</span>
          <span class="font-medium text-zinc-800">{{ remainingAfter }} 🍗</span>
        </div>
        <p v-if="replacing" class="text-xs text-amber-600 pt-1">将替换当前装饰</p>
      </div>

      <!-- 成功反馈 [1.3.3]：余额已同步，展示你现在的样子 -->
      <p v-if="bought" class="mt-4 text-sm text-emerald-600 font-medium">
        购买成功！你现在长这样：
      </p>

      <div class="flex justify-end gap-2 mt-5">
        <button
          class="btn btn-ghost px-4 py-2 text-sm font-medium"
          :disabled="buying"
          @click="close"
        >
          {{ bought ? '完成' : '取消' }}
        </button>
        <button
          v-if="!bought"
          class="btn btn-primary px-4 py-2 text-sm font-medium"
          :disabled="buying"
          @click="confirm"
        >
          {{ buying ? '购买中…' : '确认购买' }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import type { ShopItem } from '~/types'
import { useShop } from '~/composables/useShop'
import { usePoints } from '~/composables/usePoints'
import { extractErrorMessage } from '~/composables/api'

/**
 * 商城购买确认弹窗 [3.2]：试戴预览 + 价格/时效/扣款后剩余 + 替换提示 + 成功反馈。
 * 确认 → useShop.purchase(id)（内部已按铁律 [3.1] 同步余额）→ emit('bought') 供页面刷新「我的」。
 * 余额不足（INSUFFICIENT_POINTS）toast 引导去签到。
 */
const props = defineProps<{
  modelValue: boolean
  item: ShopItem | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  /** 购买成功（页面据此刷新「我的」+ toast） */
  (e: 'bought'): void
}>()

const { user, isLoggedIn, openLogin } = useAuth()
const { purchase } = useShop()
const { balance } = usePoints()
const toast = useToast()

const buying = ref(false)
const bought = ref(false)

// 每次打开弹窗重置成功态
watch(() => props.modelValue, (open) => {
  if (open) bought.value = false
})

/** 扣款后剩余 */
const remainingAfter = computed(() => Math.max(0, balance.value - (props.item?.price ?? 0)))

/** 是否已持有同类生效装饰 → 提示「将替换当前装饰」 */
const replacing = computed(() => {
  if (!props.item) return false
  const u = user.value
  if (!u) return false
  if (props.item.type === 'avatar') {
    // 租用头像总是覆盖当前基础头像生效（双槽折叠，前端无法区分是否已租用），恒提示替换
    return !!u.avatar
  }
  if (props.item.type === 'username_color') {
    return !!u.decorColorValue && !!u.decorColorExpireAt && new Date(u.decorColorExpireAt).getTime() > Date.now()
  }
  return !!u.decorTitleValue && !!u.decorTitleExpireAt && new Date(u.decorTitleExpireAt).getTime() > Date.now()
})

function close() {
  emit('update:modelValue', false)
}

async function confirm() {
  if (!props.item) return
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  buying.value = true
  try {
    await purchase(props.item.id, props.item)
    bought.value = true
    toast.add({ title: '购买成功', color: 'success' })
    emit('bought')
  } catch (err: any) {
    const code = err?.data?.error?.code
    if (code === 'INSUFFICIENT_POINTS') {
      toast.add({ title: '鸡腿不足，去签到赚点吧 →', color: 'error' })
    } else {
      toast.add({ title: extractErrorMessage(err, '购买失败'), color: 'error' })
    }
  } finally {
    buying.value = false
  }
}
</script>
