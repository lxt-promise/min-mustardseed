import { PropsWithChildren, useEffect } from 'react'
import { useLaunch } from '@tarojs/taro'
import { setupGlobalErrorHandler, checkUpdate } from '@/utils'
import { appConfig } from '@/config/app'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log(`${appConfig.name} · 小程序 v${appConfig.version} 启动`)
    setupGlobalErrorHandler()
    checkUpdate()
  })

  // 组件挂载后兜底
  useEffect(() => {
    // 防止 React 报错影响白屏
  }, [])

  // children 是将要会渲染的页面
  return children
}

export default App
