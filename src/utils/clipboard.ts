import Taro from '@tarojs/taro'

/**
 * 统一剪贴板封装（替代网页版 navigator.clipboard + execCommand fallback）。
 * 注意：setClipboardData 成功后微信会自带一个系统「内容已复制」toast，
 * 先 hideToast 再弹自定义文案，避免双重提示。
 */
export async function copyText(text: string, tip = '已复制到剪贴板') {
  try {
    await Taro.setClipboardData({ data: text })
    try { Taro.hideToast({}) } catch (e) { /* ignore */ }
    Taro.showToast({ title: tip, icon: 'none', duration: 1600 })
    return true
  } catch (e) {
    console.warn('[clipboard.copyText]', e)
    Taro.showToast({ title: '复制失败，请重试', icon: 'none' })
    return false
  }
}
