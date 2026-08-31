<template>
  <!-- 侧边栏容器（包含遮罩层和侧边栏） -->
  <Teleport to="body">
    <!-- 遮罩层 -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/30 z-[60] lg:hidden"
        @click="emit('update:modelValue', false)"
      />
    </Transition>

    <!-- 侧边栏 -->
    <Transition
      enter-active-class="transition-transform duration-300"
      leave-active-class="transition-transform duration-300"
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="modelValue"
        class="fixed right-0 top-0 bottom-0 w-72 bg-white shadow-xl z-[70] overflow-y-auto lg:hidden"
      >
      <!-- 头部 -->
      <div class="sticky top-0 bg-white border-b border-zinc-200 px-5 py-4 flex items-center justify-between">
        <h3 class="text-base font-semibold text-zinc-800">商品类型</h3>
        <button
          class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 transition-colors"
          @click="emit('update:modelValue', false)"
        >
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <!-- 分类列表 -->
      <div class="p-4 space-y-2">
        <button
          v-for="cat in categories"
          :key="cat.value"
          class="w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors"
          :class="activeCategory === cat.value ? 'bg-blue-500 text-white' : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'"
          @click="selectCategory(cat.value)"
        >
          <AppIcon :name="cat.icon" :size="20" class="shrink-0" />
          <div class="flex-1 text-left">
            <div class="text-sm font-medium">{{ cat.label }}</div>
            <div class="text-xs opacity-75 mt-0.5">共 {{ cat.count }} 件</div>
          </div>
          <AppIcon
            v-if="activeCategory === cat.value"
            name="check"
            :size="18"
            class="shrink-0"
          />
        </button>
      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { ShopItemTypeValue } from '~/types'

interface Category {
  label: string
  value: ShopItemTypeValue
  count: number
  icon: string
}

const props = defineProps<{
  modelValue: boolean
  activeCategory: ShopItemTypeValue
  categories: Category[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'select': [value: ShopItemTypeValue]
}>()

function selectCategory(value: ShopItemTypeValue) {
  emit('select', value)
  emit('update:modelValue', false)
}
</script>
