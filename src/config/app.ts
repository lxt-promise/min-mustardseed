import Taro from '@tarojs/taro'

/**
 * 应用版本号，从 package.json 注入
 * 由 webpack DefinePlugin 或运行时从 wx.getAccountInfoSync 读取
 */
const APP_VERSION = '1.0.0'

export const appConfig = {
  version: APP_VERSION,
  name: '芥菜种子',
  shortName: '芥菜种子',
  description: '办公工具箱 + 休闲小玩意儿',
  homepage: 'pages/home/index',
  feedbackEmail: '', // 上线后填写
  privacyUrl: '', // 上线后填写
}

/** 全局埋点（占位） */
export function track(event: string, data?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[track]', event, data)
  }
  // 接入微信分析或自建埋点
}

/** 显示关于信息 */
export function showAbout() {
  Taro.showModal({
    title: `关于 ${appConfig.name}`,
    content: `${appConfig.description}\n\n版本：v${appConfig.version}\n\n小工具集合，专注日常摸鱼与高效。`,
    showCancel: false,
    confirmText: '好的',
    confirmColor: '#1a9464',
  })
}
