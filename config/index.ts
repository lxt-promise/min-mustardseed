import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import { UnifiedWebpackPluginV5 } from 'weapp-tailwindcss/webpack'
import path from 'path'
import { execSync } from 'child_process'

// https://taro-docs.jd.com/docs
export default defineConfig<'webpack5'>(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'mustard-seed',
    date: '2026-9-2',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    plugins: [],
    // 关闭 prebundle：weapp-tailwindcss 官方提示 prebundle 常出兼容问题
    compiler: {
      type: 'webpack5',
      prebundle: { enable: false },
    },
    framework: 'react',
    mini: {
      webpackChain(chain, webpack) {
        // 读取 git 信息，编译期注入（__GIT_BRANCH__ / __GIT_COMMIT__ / __GIT_DATE__）
        // 注意：Taro 对 config 文件的编译会丢掉模块顶层声明，
        // 因此这里必须自包含（只用 import 进来的 execSync/path/webpack）。
        const g = (cmd: string, fallback = 'unknown'): string => {
          try {
            return execSync(cmd, { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' }).trim()
          } catch {
            return fallback
          }
        }
        const defines = {
          __GIT_BRANCH__: JSON.stringify(g('git rev-parse --abbrev-ref HEAD')),
          __GIT_COMMIT__: JSON.stringify(g('git rev-parse --short HEAD')),
          __GIT_DATE__: JSON.stringify(g('git log -1 --format=%ct')), // unix 时间戳（秒）
        }

        chain.merge({
          plugin: {
            install: {
              plugin: UnifiedWebpackPluginV5,
              args: [
                {
                  appType: 'taro',
                  // rem -> rpx（1rem = 32rpx），与 750 设计稿对齐
                  rem2rpx: true,
                },
              ],
            },
            gitInfo: {
              plugin: webpack.DefinePlugin,
              args: [defines],
            },
          },
        })
      },
    },
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, require('./dev').default)
  }
  return merge({}, baseConfig, require('./prod').default)
})
