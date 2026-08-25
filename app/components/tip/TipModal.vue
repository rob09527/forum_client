<template>
  <AppModal
    :model-value="modelValue"
    :title="`打赏 @${targetName} 的${targetType === 'post' ? '帖子' : '评论'}`"
    width="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- 档位选择 -->
    <div class="flex items-center gap-2">
      <button
        v-for="(amt, i) in tipAmounts"
        :key="amt"
        class="flex-1 py-3 rounded-xl border text-center transition-colors"
        :class="selected === amt ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'"
        @click="pickTier(amt)"
      >
        <span class="block text-base font-semibold">{{ amt }}</span>
        <span class="block text-[10px] text-zinc-400 mt-0.5">{{ tierLabel(i) }}</span>
      </button>
      <button
        class="flex-1 py-3 rounded-xl border text-center transition-colors"
        :class="customMode ? 'border-amber-500 bg-amber-50' : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'"
        @click="customMode = true"
      >
        <span class="block text-sm font-medium">自定义</span>
        <span class="block text-[10px] text-zinc-400 mt-0.5">{{ tipMin }}~{{ tipMax }}</span>
      </button>
    </div>

    <!-- 自定义金额 -->
    <div v-if="customMode" class="mt-3">
      <input
        v-model="customInput"
        type="number"
        min="1"
        class="w-full h-10 px-3 text-sm border border-zinc-200 rounded-lg focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none"
        placeholder="输入金额"
        @keyup.enter="submit"
      />
    </div>

    <!-- 余额与到账提示（100% 到账） -->
    <div class="mt-3 flex items-center justify-between text-sm text-zinc-500">
      <span>余额 <span class="font-medium text-zinc-800 tabular-nums">{{ balance }} 🍗</span></span>
      <span v-if="amount > 0">对方将收到 <span class="font-medium text-amber-600">{{ amount }} 🍗</span></span>
    </div>

    <!-- 留言（选填，20 字） -->
    <input
      v-model="message"
      maxlength="20"
      class="mt-3 w-full h-10 px-3 text-sm border border-zinc-200 rounded-lg focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none"
      placeholder="说点什么…（选填，20 字）"
    />

    <!-- 余额不足引导 -->
    <p v-if="insufficient" class="mt-2 text-xs text-red-500">
      余额不足，还差 {{ shortfall }} 🍗 · <NuxtLink to="/checkin" class="underline" @click="close">去签到 →</NuxtLink>
    </p>

    <div class="flex justify-end gap-2 mt-5">
      <button
        class="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
        :disabled="submitting"
        @click="close"
      >
        取消
      </button>
      <button
        class="px-4 py-2 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="submitting || amount <= 0"
        @click="submit"
      >
        {{ submitting ? '打赏中…' : '打赏' }}
      </button>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import type { TipTargetType } from '~/composables/useTip'
import { useTip } from '~/composables/useTip'
import { usePoints } from '~/composables/usePoints'
import { extractErrorMessage } from '~/composables/api'

/**
 * 打赏档位弹窗 [1.5.3][3.4]：快捷档位（来自配置，默认 6/66/188）+ 自定义区间校验 +
 * 余额显示 + 100% 到账提示 + 留言。确认 → useTip.tip()（内部按铁律 [3.1] 同步自己余额）。
 * 余额不足：后端 INSUFFICIENT_POINTS → 展示「还差 N 🍗 · 去签到 →」。
 * 一人一次 [R48]：重复打赏后端抛 ALREADY_TIPPED，前端 toast 提示。
 */
const props = defineProps<{
  modelValue: boolean
  targetType: TipTargetType
  targetId: number
  /** 被打赏者用户名（标题文案用） */
  targetName: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  /** 打赏成功（页面据此刷新打赏展示） */
  (e: 'tipped'): void
}>()

const { user, isLoggedIn, openLogin } = useAuth()
const { tipAmounts, tipMin, tipMax, tip } = useTip()
const { balance } = usePoints()
const toast = useToast()

const selected = ref<number | null>(null)
const customMode = ref(false)
const customInput = ref('')
const message = ref('')
const submitting = ref(false)
const insufficient = ref(false)
const shortfall = ref(0)

// 打开时重置状态
watch(() => props.modelValue, (open) => {
  if (open) {
    selected.value = tipAmounts.value[0] ?? null
    customMode.value = false
    customInput.value = ''
    message.value = ''
    insufficient.value = false
    shortfall.value = 0
  }
})

/** 档位情绪文案（默认三档：鼓励一下 / 很有帮助 / 干货满满） */
const TIER_LABELS = ['鼓励一下', '很有帮助', '干货满满']
function tierLabel(i: number): string {
  return TIER_LABELS[i] ?? ''
}

function pickTier(amt: number) {
  selected.value = amt
  customMode.value = false
}

/** 当前选中金额：自定义输入优先（提交时校验区间） */
const amount = computed<number>(() => {
  if (customMode.value) {
    const n = Number(customInput.value)
    return Number.isFinite(n) ? Math.floor(n) : 0
  }
  return selected.value ?? 0
})

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  if (!isLoggedIn.value) {
    openLogin()
    return
  }
  const amt = amount.value
  // 自定义区间校验（超出 toast 引导）
  if (customMode.value) {
    if (amt < tipMin.value || amt > tipMax.value) {
      toast.add({ title: `打赏金额需在 ${tipMin.value} ~ ${tipMax.value} 🍗 之间`, color: 'error' })
      return
    }
  }
  submitting.value = true
  try {
    await tip({
      targetType: props.targetType,
      targetId: props.targetId,
      amount: amt,
      message: message.value.trim() || undefined,
    })
    toast.add({ title: '打赏成功', color: 'success' })
    close()
    emit('tipped')
  } catch (err: any) {
    const code = err?.data?.error?.code
    if (code === 'INSUFFICIENT_POINTS') {
      // 还差 N 🍗：打赏目标 − 当前余额
      shortfall.value = Math.max(0, amt - balance.value)
      insufficient.value = true
    } else if (code === 'ALREADY_TIPPED') {
      toast.add({ title: '已经打赏过啦，感谢支持', color: 'info' })
    } else if (code === 'CANNOT_TIP_SELF') {
      toast.add({ title: '不能给自己打赏哦', color: 'info' })
    } else {
      toast.add({ title: extractErrorMessage(err, '打赏失败'), color: 'error' })
    }
  } finally {
    submitting.value = false
  }
}
</script>
