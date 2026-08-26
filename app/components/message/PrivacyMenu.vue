<template>
  <div ref="menuRef" class="relative">
    <button
      class="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors"
      title="谁可以私信我"
      @click="open = !open"
    >
      <AppIcon name="lock" :size="13" />
      <span class="hidden sm:inline">{{ currentLabel }}</span>
      <AppIcon name="chevron-down" :size="12" />
    </button>

    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden z-50"
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          class="w-full px-4 py-2 text-sm text-left hover:bg-zinc-100 flex items-center justify-between transition-colors"
          :class="opt.value === privacy ? 'text-blue-600 font-medium' : 'text-zinc-700'"
          @click="select(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <AppIcon v-if="opt.value === privacy" name="check" :size="14" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, DmPrivacyType } from '~/types'
import { DmPrivacyLabel } from '~/types'
import { useApiBase } from '~/composables/api'
import { extractErrorMessage } from '~/composables/api'

/** 私信隐私开关下拉（谁可以私信我：所有人 / 仅关注我的人 / 关闭） */
const apiBase = useApiBase()
const toast = useToast()

const privacy = ref<DmPrivacyType>('everyone')
const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const options: { value: DmPrivacyType; label: string }[] = [
  { value: 'everyone', label: '所有人可私信' },
  { value: 'followers', label: '仅关注我的人' },
  { value: 'nobody', label: '关闭私信' },
]

const currentLabel = computed(() => DmPrivacyLabel[privacy.value] ?? '所有人')

async function load(): Promise<void> {
  try {
    const res = await $fetch<ApiResponse<{ privacy: DmPrivacyType }>>(
      `${apiBase.value}/api/me/dm-privacy`
    )
    privacy.value = res.data.privacy
  } catch {
    // 隐私设置读取失败保持默认值
  }
}

async function select(value: DmPrivacyType): Promise<void> {
  open.value = false
  try {
    const res = await $fetch<ApiResponse<{ privacy: DmPrivacyType }>>(
      `${apiBase.value}/api/me/dm-privacy`,
      { method: 'PUT', body: { privacy: value } }
    )
    privacy.value = res.data.privacy
    toast.add({ title: '私信设置已更新', color: 'success' })
  } catch (err: any) {
    toast.add({ title: extractErrorMessage(err, '更新失败'), color: 'error' })
  }
}

function handleClickOutside(e: MouseEvent): void {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  load()
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
