<template>
  <div class="space-y-1.5 rounded-xl bg-zinc-50 p-4">
    <!-- 现在：购买前的佩戴状态 -->
    <div class="flex items-center gap-2">
      <span class="w-12 shrink-0 text-xs text-zinc-400">现在</span>
      <Avatar :username="beforeAuthor.username" :avatar="beforeAuthor.avatar" size="sm" />
      <UsernameText :author="beforeAuthor" :link="false" />
    </div>
    <!-- 购买后：当前状态叠加待购效果 -->
    <div class="flex items-center gap-2">
      <span class="w-12 shrink-0 text-xs text-zinc-400">购买后</span>
      <Avatar :username="afterAuthor.username" :avatar="afterAuthor.avatar" size="sm" />
      <UsernameText :author="afterAuthor" :link="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ShopItem } from '~/types'

/**
 * 试戴预览 [1.3.3][3.2]：展示「现在 vs 购买后」的前后对比。
 * 两侧都复用全站统一的 <UsernameText> —— 所见即所得由复用保证，不重写任何样式。
 * 购买后 = 当前全量状态 + 只覆盖待购商品影响的槽位（买颜色保留现有称号、买头像保留现有颜色/称号）。
 */
const props = defineProps<{ item: ShopItem }>()

const { user } = useAuth()

/** 预览「不过期」的远期时间戳：UsernameText 的有效期校验要求 expireAt 非空且在未来，
 *  传 null 会让预览的称号图/颜色判为「已过期」而不渲染。 */
const FAR_FUTURE = '2099-12-31T23:59:59.000Z'

/** 当前登录用户的装饰全量快照（头像 / 颜色 / 称号 + 真实过期时间） */
function currentSnapshot() {
  const u = user.value
  return {
    username: u?.username ?? '预览',
    avatar: u?.avatar ?? null,
    level: u?.level,
    decorColorValue: u?.decorColorValue ?? null,
    decorColorExpireAt: u?.decorColorExpireAt ?? null,
    decorTitleValue: u?.decorTitleValue ?? null,
    decorTitleStyle: u?.decorTitleStyle ?? null,
    decorTitleExpireAt: u?.decorTitleExpireAt ?? null,
  }
}

/** 现在：当前真实佩戴状态。
 *  id 传真实值 → UsernameText 对「作者 == 我」走 authUser 实时覆盖，天然显示当前佩戴态。 */
const beforeAuthor = computed(() => ({ id: user.value?.id ?? 0, ...currentSnapshot() }))

/** 购买后：当前全量状态叠加待购商品的槽位。
 *  id 故意传 0（而非真实用户 id）：UsernameText 对「作者 == 我」会用 authUser 实时值覆盖 [3.9]，
 *  否则叠加后的效果会被当前佩戴值顶掉 —— 点购买 2 时预览仍显示上一件（同 MyDecorationItem 的约定）。 */
const afterAuthor = computed(() => {
  const base = currentSnapshot()
  if (props.item.type === 'avatar') {
    base.avatar = props.item.renderValue
  } else if (props.item.type === 'username_color') {
    base.decorColorValue = props.item.renderValue
    base.decorColorExpireAt = FAR_FUTURE
  } else {
    base.decorTitleValue = props.item.renderValue
    base.decorTitleStyle = props.item.renderStyle
    base.decorTitleExpireAt = FAR_FUTURE
  }
  return { id: 0, ...base }
})
</script>
