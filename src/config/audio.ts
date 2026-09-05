/**
 * 音频 CDN 基地址 —— 全项目唯一音频 URL 来源。
 * 换域名 / 换格式只改这里。
 *
 * ⚠️ 当前状态：
 * - 开发/测试期：音频文件暂不可用，URL 留空
 * - 正式上线前：将音频文件上传到已备案 CDN（如腾讯云 COS），
 *   修改 AUDIO_CDN_BASE 即可。
 */
export const AUDIO_CDN_BASE = 'https://lxt-java.github.io/mustardseed/audio'

export const audioUrl = (name: string) => `${AUDIO_CDN_BASE}/${name}`

// 现成 6 首内置音频（钢琴合成曲 3 + 环境音 3）
// ⚠️ 注意：当前 CDN 404，音频暂不可用。需上传音频文件后取消注释。
export const TRACK_URLS = {
  // pianoCanon: audioUrl('piano_canon_real.wav'),
  // pianoFurElise: audioUrl('piano_fur_elise.wav'),
  // pianoMoonlight: audioUrl('piano_moonlight.wav'),
  // ambRain: audioUrl('amb_rain.wav'),
  // ambForest: audioUrl('amb_forest.wav'),
  // ambCafe: audioUrl('amb_cafe.wav'),
}

/** 音频是否可用 */
export function isAudioAvailable(): boolean {
  return Object.values(TRACK_URLS).some(v => !!v)
}
