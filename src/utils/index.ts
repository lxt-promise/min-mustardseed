/**
 * 通用工具函数
 */

import Taro from '@tarojs/taro'

/** 生成唯一 ID（短） */
export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36).slice(-4)
}

/** 防抖 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

/** 节流 */
export function throttle<T extends (...args: any[]) => any>(fn: T, delay = 300): T {
  let last = 0
  return ((...args: any[]) => {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn(...args)
    }
  }) as T
}

/** 格式化日期 YYYY-MM-DD */
export function ymd(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 友好时间显示 */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '刚刚'
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟前`
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小时前`
  if (sec < 604800) return `${Math.floor(sec / 86400)} 天前`
  return ymd(new Date(ts))
}

/** 小程序全局错误处理 */
export function setupGlobalErrorHandler() {
  // console.error 全局捕获
  const origError = console.error
  console.error = (...args: any[]) => {
    origError.apply(console, args)
    // 这里可以上报到日志服务
  }
  // Taro 错误回调
  Taro.onError?.((err) => {
    console.warn('[global error]', err)
  })
  // 静默处理未捕获 Promise 拒绝
  if (typeof (globalThis as any).addEventListener === 'function') {
    (globalThis as any).addEventListener('unhandledrejection', (e: any) => {
      console.warn('[unhandledrejection]', e?.reason)
    })
  }
}

/** 检查更新（小程序自身能力，可由页面在 onShow 中调用） */
export async function checkUpdate() {
  try {
    const updateManager = Taro.getUpdateManager?.()
    if (!updateManager) return
    updateManager.onUpdateReady(() => {
      Taro.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) updateManager.applyUpdate()
        },
      })
    })
    updateManager.onUpdateFailed(() => {
      Taro.showToast({ title: '新版本下载失败', icon: 'none' })
    })
  } catch (e) {
    // ignore
  }
}
