/**
 * 编辑器表情数据。
 *
 * - EMOJI_GROUPS:标准 unicode emoji,纯数据,无需任何资源,点击直接插入 emoji 字符。
 * - STICKERS:内置表情包(sticker),素材放在 client/public/stickers/,Twemoji SVG(Apache-2.0 / CC-BY-4.0)。
 *   插入时拼成 Markdown 图片 `![名称](/stickers/xxx.svg)`,与现有图片链路一致(相对路径,渲染走同源)。
 */

export interface EmojiGroup {
  name: string
  emojis: string[]
}

export interface Sticker {
  /** 展示名(alt) */
  name: string
  /** public/stickers 下的文件名 */
  file: string
}

/** 标准 Emoji(按常用分组,控制在 200 个以内避免面板过长) */
export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    name: '笑脸',
    emojis: [
      '😀', '😁', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '😘', '😋', '😜',
      '🤪', '🤔', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😌', '😔',
      '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '😎', '🤓',
      '🥳', '😭', '😤', '😠', '😡', '🤬', '🤯', '😱', '😨', '😰', '😥', '😓',
      '🤗', '🤭', '🤫', '😳', '😞', '😟', '😢', '😣', '😖', '😫', '😩', '🥺',
      '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '🤖', '😺',
    ],
  },
  {
    name: '手势',
    emojis: [
      '👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '✍️', '💪', '🦾',
      '👀', '👁️', '👃', '👂', '🦻', '👄', '🦷', '👅',
    ],
  },
  {
    name: '爱心',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌', '💋', '💍', '💎',
    ],
  },
  {
    name: '符号',
    emojis: [
      '✅', '❌', '⭕', '💯', '🔥', '⭐', '🌟', '✨', '⚡', '💫', '💥', '💢',
      '💦', '💨', '💬', '👥', '💭', '🎉', '🎊', '🎁', '🎈', '🎏', '🎀', '🥰',
    ],
  },
]

/** 内置表情包清单(文件名 → 中文名),与 public/stickers/ 目录一一对应 */
export const STICKERS: Sticker[] = [
  { name: '点赞', file: 'zan.svg' },
  { name: '着火', file: 'huo.svg' },
  { name: '满分', file: '100.svg' },
  { name: '庆祝', file: 'pa.svg' },
  { name: '大笑', file: 'xiao.svg' },
  { name: '大哭', file: 'ku.svg' },
  { name: '爱心', file: 'ai.svg' },
  { name: '流汗', file: 'han.svg' },
  { name: '好的', file: 'ok.svg' },
  { name: '祈祷', file: 'qidao.svg' },
  { name: '肌肉', file: 'shoulibing.svg' },
  { name: '鼓掌', file: 'guzhang.svg' },
  { name: '敬礼', file: 'jingli.svg' },
  { name: '比心', file: 'bixin.svg' },
  { name: '老板打赏', file: 'laoyedashang.svg' },
  { name: '火箭', file: 'huojian.svg' },
  { name: '举手', file: 'jushou.svg' },
  { name: '耶', file: 'v.svg' },
  { name: '思考', file: 'sikao.svg' },
  { name: '眨眼', file: 'zhayan.svg' },
  { name: '邪笑', file: 'xiexiao.svg' },
  { name: '海笑', file: 'haixiao.svg' },
  { name: '生气', file: 'shengqi.svg' },
  { name: '困', file: 'kun.svg' },
  { name: '尴尬', file: 'gan.svg' },
  { name: '小丑', file: 'xiaochou.svg' },
  { name: '感觉', file: 'ganjue.svg' },
  { name: '狗屎', file: 'goushi.svg' },
  { name: '鬼把', file: 'guiba.svg' },
  { name: '外星人', file: 'waixingren.svg' },
  { name: '机器人', file: 'jiqiren.svg' },
  { name: '小狗', file: 'gou.svg' },
  { name: '小猫', file: 'mao.svg' },
  { name: '熊猫', file: 'xiongmao.svg' },
  { name: '狐狸', file: 'huli.svg' },
  { name: '猴子', file: 'houzi.svg' },
  { name: '小猪', file: 'zhu.svg' },
  { name: '青蛙', file: 'qingwa.svg' },
  { name: '蜜蜂', file: 'mifeng.svg' },
  { name: '虫子', file: 'chong.svg' },
  { name: '小鸡', file: 'ji.svg' },
  { name: '企鹅', file: 'qi_e.svg' },
  { name: '小鱼', file: 'yu.svg' },
  { name: '海豚', file: 'haitun.svg' },
  { name: '老虎', file: 'hu.svg' },
  { name: '考拉', file: 'kaola.svg' },
  { name: '独角兽', file: 'dujiaoshou.svg' },
]

/** 表情包图片 URL */
export function stickerUrl(sticker: Sticker): string {
  return `/stickers/${sticker.file}`
}
