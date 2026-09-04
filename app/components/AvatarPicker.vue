<template>
  <div>
    <p class="text-sm text-zinc-600 mb-3">
      选择本地头像（{{ styles.length }} 个风格 × {{ perStyle }} 个），也可以上传自己的图片
    </p>

    <!-- 风格分类：点击展开该风格的 20 个头像 -->
    <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
      <button
        v-for="s in styles"
        :key="s.id"
        class="flex flex-col items-center gap-1 p-2 rounded-lg transition-all border-2"
        :class="expandedStyle === s.id
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-zinc-200 bg-white hover:border-zinc-200'"
        @click="expandedStyle = s.id"
      >
        <div class="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 flex-shrink-0">
          <img :src="localAvatarPath(s.id, 1)" :alt="s.label" class="w-full h-full" loading="lazy" />
        </div>
        <span class="text-[10px] text-zinc-600 leading-tight text-center inline-flex items-center justify-center gap-0.5"><AppIcon :name="s.icon" :size="11" /> {{ s.label }}</span>
      </button>
    </div>

    <!-- 当前风格的预置头像：全部直接可点选（§9.2 已下线头像商城，无锁、无价格） -->
    <div v-if="expandedStyle" class="grid grid-cols-4 sm:grid-cols-8 gap-1.5 max-h-[320px] overflow-y-auto">
      <button
        v-for="n in perStyle"
        :key="n"
        class="relative rounded-lg transition-all border-2"
        :class="isSelected(expandedStyle, n)
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-zinc-200 bg-white hover:border-zinc-200'"
        @click="emit('select', localAvatarPath(expandedStyle, n))"
      >
        <img
          :src="localAvatarPath(expandedStyle, n)"
          :alt="`${expandedStyle}-${n}`"
          class="w-full h-full rounded-md"
          loading="lazy"
        />
      </button>
    </div>

    <!-- ── 自定义上传（§9.2）：浏览器 API 只在事件回调内触碰，SSR 安全 ── -->
    <div class="mt-4 pt-4 border-t border-zinc-200">
      <div class="flex items-center justify-between gap-2 mb-2">
        <span class="text-sm text-zinc-700">上传自定义头像</span>
        <span class="text-[11px] text-zinc-500">JPG/PNG/WebP/GIF，≤{{ maxSizeMb }}MB，超出会被压缩</span>
      </div>

      <input
        ref="fileInput"
        type="file"
        :accept="acceptAttr"
        class="hidden"
        @change="onFileChange"
      />

      <div class="flex items-center gap-3">
        <!-- 预览（选择中/上传中/成功后都展示当前待用图） -->
        <div class="w-16 h-16 rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
          <img v-if="preview" :src="preview" alt="待上传头像预览" class="w-full h-full object-cover" />
          <AppIcon v-else name="user" :size="20" class="text-zinc-400" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <button
              class="btn btn-ghost px-3 py-1.5 text-sm"
              :disabled="isUploading"
              @click="pickFile"
            >
              {{ pickedFile ? '重新选择' : '选择图片' }}
            </button>
            <button
              v-if="pickedFile"
              class="btn btn-primary px-3 py-1.5 text-sm"
              :disabled="isUploading"
              @click="doUpload"
            >
              {{ isUploading ? '上传中…' : uploadError ? '重试上传' : '确认上传' }}
            </button>
          </div>

          <!-- 四态提示：Loading / Error（可重试）/ Success / Empty -->
          <p v-if="isUploading" class="text-xs text-zinc-500 mt-1.5">正在上传并压缩，请稍候…</p>
          <p v-else-if="uploadError" class="text-xs text-red-600 mt-1.5 break-words">{{ uploadError }}</p>
          <p v-else-if="uploadedAvatar" class="text-xs text-emerald-600 mt-1.5">头像已更新 ✓</p>
          <p v-else-if="pickedFile" class="text-xs text-zinc-500 mt-1.5 truncate">已选择「{{ pickedFile.name }}」，点「确认上传」生效</p>
          <p v-else class="text-xs text-zinc-500 mt-1.5">还没有选择图片</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { deriveStyleDefs, localAvatarPath } from '~/utils/avatar'
import { useAvatarStyles } from '~/composables/useAvatarStyles'
import { AVATAR_ACCEPT_ATTR, AVATAR_MAX_SIZE, useAvatarUpload } from '~/composables/useAvatarUpload'

const props = defineProps<{
  /** 当前头像路径（/avatars/... 或 /uploads/...），用于高亮已选中的头像 */
  currentAvatar?: string
}>()

const emit = defineEmits<{
  /** 选中某个预置本地头像，传出完整路径（落库由父级负责） */
  select: [avatar: string]
  /** 自定义头像上传成功且已落库，传出服务端最终认定的头像路径 */
  uploaded: [avatar: string]
}>()

// 权威风格清单与每风格数量由后端下发；未就绪时为空数组，列表暂不渲染（不会闪错头像）
const { data: avatarStyles } = useAvatarStyles()
const styles = computed(() => deriveStyleDefs(avatarStyles.value?.styles ?? []))
const perStyle = computed(() => avatarStyles.value?.perStyle ?? 20)

/** 当前展开的风格（默认高亮到用户当前头像所属风格，否则机器人） */
const expandedStyle = ref<string>(
  (() => {
    const m = props.currentAvatar?.match(/^\/avatars\/([^/]+)\//)
    return m?.[1] ?? 'bottts-neutral'
  })()
)

/** 某个头像是否被选中（按路径精确匹配） */
function isSelected(style: string, n: number): boolean {
  return props.currentAvatar === localAvatarPath(style, n)
}

// ── 自定义上传 ──
const {
  data: uploadedAvatar,
  isLoading: isUploading,
  error: uploadError,
  preview,
  select: selectFile,
  upload,
} = useAvatarUpload()

const acceptAttr = AVATAR_ACCEPT_ATTR
const maxSizeMb = AVATAR_MAX_SIZE / 1024 / 1024

const fileInput = ref<HTMLInputElement | null>(null)
/** 当前待上传文件；仅浏览器侧存在（由 change 事件写入），支持失败后原样重试 */
const pickedFile = ref<File | null>(null)

function pickFile() {
  fileInput.value?.click()
}

/** 选择文件：前置检查不通过则不留下待上传态（错误文案由 composable 给） */
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  // 清空 value，使「选同一个文件」也能再次触发 change（重试路径）
  input.value = ''
  if (!file) return
  pickedFile.value = selectFile(file) ? file : null
}

async function doUpload() {
  if (!pickedFile.value) return
  try {
    const avatar = await upload(pickedFile.value)
    emit('uploaded', avatar)
  } catch {
    // 错误已写入 composable 的 error（服务端原文），模板展示 + 「重试上传」按钮，不再吞掉
  }
}
</script>
