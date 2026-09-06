import React, { useState } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { appConfig, showAbout } from '@/config/app'
import logoImg from '@/assets/logo.png'
import './index.scss'

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

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <View className="flex items-center justify-between py-2.5">
    <Text className="text-sm text-mint-700/80">{label}</Text>
    <Text className={`text-sm text-mint-900 font-medium ${mono ? 'font-mono' : ''}`}>{value}</Text>
  </View>
)

export default function More() {
  const [env] = useState(envLabel)

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
