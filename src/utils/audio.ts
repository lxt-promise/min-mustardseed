import Taro from '@tarojs/taro'

/**
 * 三音上行提示音（C5-E5-G5），替代网页版 Pomodoro 的 AudioContext beep。
 * 基础库 >= 2.19 支持 Taro.createWebAudioContext；不可用时降级为振动。
 */
export function playFinishChime(enabled: boolean) {
  if (!enabled) return
  Taro.vibrateShort({ type: 'heavy' }).catch(() => {})
  try {
    const ctx = Taro.createWebAudioContext()
    const tones = [523.25, 659.25, 783.99]
    tones.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      osc.connect(gain)
      gain.connect(ctx.destination)
      const t0 = ctx.currentTime + i * 0.22
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22)
      osc.start(t0)
      osc.stop(t0 + 0.25)
    })
    setTimeout(() => {
      try { ctx.close() } catch (e) { /* ignore */ }
    }, 1200)
  } catch (e) {
    // 降级：长振动
    Taro.vibrateLong().catch(() => {})
  }
}
