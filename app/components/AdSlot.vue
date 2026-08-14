<template>
  <!-- 无广告时渲染空（调用方布局自动收起占位空间） -->
  <template v-if="ad">
    <!-- 站内链接：SPA 跳转 -->
    <NuxtLink
      v-if="ad.link?.startsWith('/')"
      :to="ad.link"
      class="block overflow-hidden rounded-lg border border-zinc-700/50 hover:opacity-90 transition-opacity"
    >
      <img :src="ad.image" :alt="ad.title ?? '广告'" :class="imgClass" loading="lazy" />
    </NuxtLink>

    <!-- 外链：新开标签页 -->
    <a
      v-else-if="ad.link"
      :href="externalHref(ad.link)"
      target="_blank"
      rel="noopener noreferrer"
      class="block overflow-hidden rounded-lg border border-zinc-700/50 hover:opacity-90 transition-opacity"
    >
      <img :src="ad.image" :alt="ad.title ?? '广告'" :class="imgClass" loading="lazy" />
    </a>

    <!-- 无链接：纯展示 -->
    <div v-else class="overflow-hidden rounded-lg border border-zinc-700/50">
      <img :src="ad.image" :alt="ad.title ?? '广告'" :class="imgClass" loading="lazy" />
    </div>
  </template>
</template>

<script setup lang="ts">
import type { Advert } from '~/types'

const props = defineProps<{
  ad?: Advert | null
}>()

/**
 * 各广告位对图片的尺寸约束：
 * 列表内嵌用固定高度 + object-cover 裁剪，避免超宽/超高图撑破布局；
 * 侧边栏自适应（w-full h-auto，由运营按比例上传）。
 */
const imgClass = computed(() => {
  switch (props.ad?.position) {
    case 'inline':
      return 'w-full h-20 sm:h-24 object-cover'
    default:
      return 'w-full h-auto'
  }
})

/** 外链补全协议（同公告栏：无协议的裸域名自动补 https://） */
function externalHref(link: string): string {
  const trimmed = link.trim()
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) return trimmed
  return `https://${trimmed}`
}
</script>
