import React, { useState } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { appConfig, showAbout } from '@/config/app'
import { copyText } from '@/utils/clipboard'
import logoImg from '@/assets/logo.png'
import './index.scss'

/** 非 tabBar 工具目录（tab 页：首页/待办/金句 不重复列出） */
const TOOLS = [
  { path: '/pages/pomodoro/index', icon: '🍅', name: '番茄钟', desc: '专注计时 · 三种模式', color: 'from-rose-400 to-orange-400' },
  { path: '/pages/workdays/index', icon: '📅', name: '工作日计算', desc: '双休/单休/大小周', color: 'from-indigo-400 to-mint-500' },
  { path: '/pages/picker/index', icon: '🎯', name: '纠结人神器', desc: '吃啥？选啥？帮你决定', color: 'from-amber-400 to-pink-500' },
  { path: '/pages/music/index', icon: '🎵', name: '音乐小站', desc: '钢琴曲 / 白噪音', color: 'from-cyan-400 to-mint-500' },
  { path: '/pages/quiz/index', icon: '🧠', name: '趣味测试', desc: '性格 / 笑话 / 锦囊', color: 'from-fuchsia-400 to-indigo-500' },
]

/** 小程序版本环境（开发版/体验版/正式版） */
function envLabel(): string {
  try {
    const env = Taro.getAccountInfoSync()?.miniProgram?.envVersion
    if (env === 'develop') return '开发版'
    if (env === 'trial') return '体验版'
    if (env === 'release') return '正式版'
    return env || '—'
  } catch {
    return '—'
  }
}

function gitDate(): string {
  try {
    const ts = Number(__GIT_DATE__)
    if (!Number.isFinite(ts) || ts <= 0) return '—'
    const d = new Date(ts * 1000)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  } catch {
    return '—'
  }
}

function copyGitInfo() {
  copyText(
    `芥菜种子 · 构建信息\n分支：${__GIT_BRANCH__}\n提交：${__GIT_COMMIT__}\n时间：${gitDate()}\n版本：v${appConfig.version}`,
    '已复制构建信息'
  )
}

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <View className="flex items-center justify-between py-2.5">
    <Text className="text-sm text-mint-700/80">{label}</Text>
    <Text className={`text-sm text-mint-900 font-medium ${mono ? 'font-mono' : ''}`}>{value}</Text>
  </View>
)

export default function More() {
  const [env] = useState(envLabel)

  function openTool(path: string) {
    Taro.navigateTo({ url: path })
  }

  return (
    <View className="animate-fade-up px-4 pt-5 pb-10">
      {/* 品牌头部 */}
      <View className="flex items-center gap-4">
        <Image src={logoImg} className="w-16 h-16 rounded-2xl shadow-soft" mode="aspectFill" />
        <View className="flex-1">
          <View className="flex items-center gap-2">
            <Text className="text-2xl font-bold text-mint-900 tracking-tight">{appConfig.name}</Text>
            <Text className="text-[10px] bg-mint-100 text-mint-700 font-semibold px-2 py-0.5 rounded-full">
              v{appConfig.version}
            </Text>
          </View>
          <Text className="mt-1 block text-xs text-mint-800/70">{appConfig.description}</Text>
        </View>
      </View>

      {/* 版本信息 */}
      <View className="mt-5 rounded-2xl bg-white/80 border border-mint-100 shadow-card px-4 py-2">
        <Text className="block text-sm font-semibold text-mint-800 pt-2">📌 版本信息</Text>
        <View className="divide-y divide-mint-50">
          <Row label="当前版本" value={`v${appConfig.version}`} mono />
          <Row label="版本环境" value={env} />
          <Row label="发布名称" value={appConfig.shortName} />
        </View>
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          className="pb-1 pt-0.5"
          onClick={showAbout}
        >
          <Text className="text-xs text-mint-600 underline">查看关于本程序</Text>
        </View>
      </View>

      {/* Git 信息 */}
      <View className="mt-4 rounded-2xl bg-white/80 border border-mint-100 shadow-card px-4 py-2">
        <View className="flex items-center justify-between pt-2 pb-1">
          <Text className="text-sm font-semibold text-mint-800">🌿 构建信息</Text>
          <View hoverClass="view-press" hoverStayTime="80" onClick={copyGitInfo}>
            <Text className="text-[11px] text-mint-500">复制</Text>
          </View>
        </View>
        <View>
          <Row label="分支" value={__GIT_BRANCH__} mono first />
          <Row label="最近提交" value={__GIT_COMMIT__} mono />
          <Row label="提交时间" value={gitDate()} mono />
        </View>
      </View>

      {/* 工具目录 */}
      <View className="mt-4">
        <Text className="block text-sm font-semibold text-mint-800 mb-2 px-1">🧰 全部工具</Text>
        <View className="rounded-2xl bg-white/80 border border-mint-100 shadow-card overflow-hidden">
          {TOOLS.map((t, i) => (
            <View
              key={t.path}
              hoverClass="view-press"
              hoverStayTime="80"
              className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-mint-50' : ''}`}
              onClick={() => openTool(t.path)}
            >
              <View className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-sm`}>
                <Text className="text-xl leading-none">{t.icon}</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="block text-sm font-semibold text-mint-900">{t.name}</Text>
                <Text className="block text-[11px] text-mint-700/60 mt-0.5">{t.desc}</Text>
              </View>
              <Text className="text-mint-300 text-lg">›</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 建议反馈 */}
      <View className="mt-4 rounded-2xl bg-white/80 border border-mint-100 shadow-card p-4">
        <Text className="block text-sm font-semibold text-mint-800">💬 建议与反馈</Text>
        <Text className="block mt-1 text-xs text-mint-700/60 leading-5">
          用过程中发现任何问题，或想聊聊「下一粒种子种什么」，都欢迎告诉我们：
        </Text>
        <Button openType="feedback" className="more-feedback-btn w-full mt-3">
          <View className="w-full py-2.5 flex items-center justify-center rounded-xl bg-gradient-to-r from-mint-500 to-mint-600 shadow-soft">
            <Text className="text-sm font-semibold text-white">📝 去提建议</Text>
          </View>
        </Button>
      </View>

      {/* 底部版权 */}
      <View className="mt-6 text-center">
        <Text className="block text-[11px] text-mint-700/50">🌱 {appConfig.name} · 每一件小事都算数</Text>
      </View>
    </View>
  )
}
