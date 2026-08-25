<template>
  <span class="inline-flex items-center gap-1 min-w-0" :class="sizeClass">
    <!-- 用户名：有色（生效中）时套 CSS 色值；过期/无值走默认色 [R46] -->
    <NuxtLink
      v-if="link"
      :to="`/user/${author.id}`"
      class="font-medium hover:underline truncate min-w-0"
      :style="colorActive ? { color: colorActive } : undefined"
    >
      {{ author.username }}
    </NuxtLink>
    <!-- link=false：外层已有 <NuxtLink>，仅渲染文本避免嵌套 <a> -->
    <span
      v-else
      class="font-medium truncate min-w-0"
      :style="colorActive ? { color: colorActive } : undefined"
    >
      {{ author.username }}
    </span>

    <!-- 等级徽章（存量）：NewUser 等无 level 场景自动隐藏 -->
    <span
      v-if="showBadges && author.level"
      class="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
      :class="levelBadgeClass"
    >
      {{ levelLabel }}
    </span>

    <!-- 称号徽章：图片索引形态（renderValue = /images/title-icons/ 下的 webp 文件名主干）[1.3.7] -->
    <img
      v-if="showBadges && titleActive && titleIsImage"
      :src="titleImgSrc"
      alt=""
      class="shrink-0 w-auto align-middle"
      :class="titleIconSize"
    />
    <!-- 兼容：历史文本称号（非图片索引）回退为文字胶囊 -->
    <span
      v-else-if="showBadges && titleActive"
      class="rounded-full px-1.5 py-0.5 shrink-0 bg-zinc-200 text-zinc-600"
      :class="titleBadgeSize"
    >
      {{ titleActive }}
    </span>
  </span>
</template>

<script setup lang="ts">
import type { AuthorBrief } from '~/types'
import { useGameConfig } from '~/composables/useGameConfig'
import { useAuth } from '~/composables/useAuth'
import { isTitleImage, titleIconPath } from '~/utils/decoration'

/**
 * 全站统一的用户名渲染：应用用户名颜色 + 等级徽章 + 称号徽章 [3.3][1.3.7]。
 * 「全站只允许一个组件负责用户名渲染」——所有展示作者名的渲染点改用它，装饰即可全站生效。
 *
 * 装饰生效判定统一在这里：value 与 expireAt 成对存在且未过期才应用，过期即恢复默认 [R46][1.8]。
 * author 取最小结构（level 可缺省）：AuthorBrief / User / FollowUserItem / UserProfile / NewUser 均可传入。
 */
interface Props {
  /** 用户摘要（含装饰槽；NewUser 等无 level 场景徽章自动隐藏） */
  author: AuthorBrief | {
    id: number
    username: string
    level?: string | null
    decorColorValue?: string | null
    decorColorExpireAt?: string | null
    decorTitleValue?: string | null
    decorTitleStyle?: string | null
    decorTitleExpireAt?: string | null
  }
  /** 文本尺寸档位：xs 列表紧凑 | sm 默认 | lg 页面大标题 */
  size?: 'xs' | 'sm' | 'lg'
  /** 是否渲染跳转链接；外层已有链接时传 false 避免嵌套 <a> */
  link?: boolean
  /** 是否显示等级/称号徽章；顶栏头像旁等紧凑处传 false 只显用户名 */
  showBadges?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  link: true,
  showBadges: true,
})

const { levelName, levelBadgeClass: badgeFor } = useGameConfig()
const { user: me } = useAuth()

// 渲染「自己」时装饰字段以 authUser 实时值为准：购买/换购后无需刷新列表即变色 [3.9]。
// 列表里的 author 是拉取时的快照，装饰是「我」的属性，authUser 才是权威实时源。
const effective = computed(() => {
  if (me.value && me.value.id === props.author.id) return me.value
  return props.author
})

const levelLabel = computed(() => levelName(props.author.level ?? null))
const levelBadgeClass = computed(() => badgeFor(props.author.level ?? null))

const sizeClass = computed(() => {
  const map = { xs: 'text-xs', sm: 'text-sm', lg: 'text-lg' } as const
  return map[props.size]
})
const titleBadgeSize = computed(() => {
  const map = { xs: 'text-[10px]', sm: 'text-xs', lg: 'text-sm' } as const
  return map[props.size]
})
/** 称号图片高度档位（webp 为 3:1 长条，高度随文本档位缩放） */
const titleIconSize = computed(() => {
  const map = { xs: 'h-3.5', sm: 'h-4', lg: 'h-5' } as const
  return map[props.size]
})

/** 用户名颜色：有效期校验 [R46] */
const colorActive = computed(() => {
  const v = effective.value.decorColorValue
  const exp = effective.value.decorColorExpireAt
  return v && exp && new Date(exp).getTime() > Date.now() ? v : null
})

/** 称号值（图片索引 key 或历史文本）：有效期校验 [R46] */
const titleActive = computed(() => {
  const v = effective.value.decorTitleValue
  const exp = effective.value.decorTitleExpireAt
  return v && exp && new Date(exp).getTime() > Date.now() ? v : null
})

/** 称号是否为图片索引（约定见 utils/decoration.ts） */
const titleIsImage = computed(() => isTitleImage(titleActive.value))

/** 称号图片资源地址（约定见 utils/decoration.ts） */
const titleImgSrc = computed(() => titleIconPath(titleActive.value ?? ''))
</script>
