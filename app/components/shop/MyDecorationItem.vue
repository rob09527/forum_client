<template>
  <div class="panel p-4 flex items-center gap-3" :class="{ 'opacity-55': !item.active }">
    <div class="flex-1 min-w-0">
      <!-- 头像持有项：直接渲染头像图；其余装饰走 UsernameText -->
      <div v-if="isAvatar" class="flex items-center gap-2.5">
        <Avatar :username="user?.username" :avatar="item.renderValue" size="md" />
        <span class="text-sm font-medium text-zinc-800 truncate">{{ avatarName }}</span>
      </div>
      <UsernameText v-else :author="author" size="sm" :link="false" class="min-w-0" />
      <div class="text-xs text-zinc-500 mt-1">
        {{ item.active ? `到期 ${expireText}` : `已过期（${expireText}）` }}
      </div>
    </div>
    <span class="text-xs text-zinc-400 shrink-0">🍗 {{ item.price }}</span>
    <button
      v-if="!item.active"
      class="btn btn-accent text-xs px-3 py-1 shrink-0"
      @click="emit('renew')"
    >
      续费
    </button>
    <button
      v-else-if="!item.worn"
      class="btn btn-primary text-xs px-3 py-1 shrink-0"
      @click="emit('switch')"
    >
      切换
    </button>
    <span v-else class="text-xs text-emerald-600 shrink-0">生效中</span>
  </div>
</template>

<script setup lang="ts">
import type { MyDecorationItem } from '~/types'

/**
 * 我的装饰持有项 [1.3.4][3.2]：佩戴中（展示快照渲染）+ 可切换（未过期但非佩戴）+ 已过期（置灰 + 一键续费）。
 * 渲染复用全站 UsernameText：持有的 renderValue/renderStyle 快照即实际效果。
 */
const props = defineProps<{ item: MyDecorationItem }>()

const emit = defineEmits<{
  renew: []
  switch: []
}>()

const { user } = useAuth()

/** 头像持有项标记 */
const isAvatar = computed(() => props.item.type === 'avatar')

/** 头像友好名：直接用后端 shop_items.name（风格-NN），不再从 renderValue 反推 */
const avatarName = computed(() => props.item.name)

/** 当前用户名 + 该持有项的快照值（两种类型只各自带一个槽位）。
 *  id 故意传 0：UsernameText 对「作者 == 我」时会用 authUser 实时值覆盖（[3.9] 购买后全站立即变色），
 *  这里要渲染的是每件持有的快照，不能用当前佩戴值覆盖，否则 4 个称号会全部显示成同一张当前佩戴的图。 */
const author = computed(() => ({
  id: 0,
  username: user.value?.username ?? '预览',
  level: user.value?.level,
  decorColorValue: props.item.type === 'username_color' ? props.item.renderValue : null,
  decorColorExpireAt: props.item.type === 'username_color' ? props.item.expireAt : null,
  decorTitleValue: props.item.type === 'title' ? props.item.renderValue : null,
  decorTitleStyle: props.item.type === 'title' ? props.item.renderStyle : null,
  decorTitleExpireAt: props.item.type === 'title' ? props.item.expireAt : null,
}))

// 到期时间带年份展示（跨年/长期持有的到期日仅月日会产生歧义，如「3/23」无法判断是哪一年）
const expireText = computed(() =>
  new Date(props.item.expireAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
)
</script>
