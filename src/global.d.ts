/** 全局类型声明 */

// 图片资源导入
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}

// 构建时由 DefinePlugin 注入（见 config/index.ts）
declare const __GIT_BRANCH__: string
declare const __GIT_COMMIT__: string
declare const __GIT_DATE__: string // 最近提交的 unix 时间戳（秒）
