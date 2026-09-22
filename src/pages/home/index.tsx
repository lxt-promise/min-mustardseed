import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { showAbout, appConfig } from '@/config/app'
import './index.scss'

type Tool = {
  path: string
  icon: string
  name: string
  desc: string
  color: string
  badge?: string
}

const officeTools: Tool[] = [
  {
    path: '/pages/pomodoro/index',
    name: '番茄钟',
    desc: '专注 25 分钟，休息 5 分钟',
    color: 'from-rose-400 to-orange-400',
    badge: '🔥 热门',
    icon: '🍅',
  },
  {
    path: '/pages/todo/index',
    name: '待办清单',
    desc: '专注搞定今天的事',
    color: 'from-mint-500 to-teal-500',
    badge: '✅ 推荐',
    icon: '✅',
  },
  {
    path: '/pages/workdays/index',
    name: '工作日计算',
    desc: '区间工作日 · 双休 / 单休 / 大小周',
    color: 'from-indigo-400 to-mint-500',
    icon: '📅',
  },
]

const funTools: Tool[] = [
  {
    path: '/pages/picker/index',
    name: '纠结人神器',
    desc: '吃啥？选啥？一键帮你决定',
    color: 'from-amber-400 to-pink-500',
    badge: '🎯 首发',
    icon: '🎯',
  },
  {
    path: '/pages/music/index',
    name: '音乐小站',
    desc: '钢琴曲 / 白噪音 · 陪伴时光',
    color: 'from-cyan-400 to-mint-500',
    badge: '🆕 新上',
    icon: '🎵',
  },
  {
    path: '/pages/quiz/index',
    name: '趣味小测试',
    desc: '颜色性格 / 笑话 / 人生锦囊',
    color: 'from-fuchsia-400 to-indigo-500',
    icon: '🧠',
  },
]

// 根据时间段与是否周末生成问候语（仅周日算周末）
function getGreeting(): string {
  const now = new Date()
  const hour = now.getHours()
  const isWeekend = now.getDay() === 0
  if (hour < 6) return isWeekend ? '凌晨好，周末愉快呀' : '凌晨好，早点休息呀'
  if (hour < 10) return isWeekend ? '早上好，周末愉快呀' : '早上好，今天也要开心呀'
  if (hour < 12) return isWeekend ? '早上好，周末愉快呀' : '早上好，元气满满呀'
  if (hour < 14) return isWeekend ? '中午好，周末愉快呀' : '中午好，记得吃饭呀'
  if (hour < 18) return isWeekend ? '下午好，周末愉快呀' : '下午好，记得喝杯水呀'
  if (hour < 22) return isWeekend ? '晚上好，周末愉快呀' : '晚上好，今天也要开心呀'
  return '夜深了，早点休息呀'
}

// TabBar 页面用 switchTab，普通页面用 navigateTo
const TabBarPages = ['/pages/home/index', '/pages/todo/index', '/pages/more/index']

function navigateToPage(path: string) {
  if (TabBarPages.includes(path)) {
    Taro.switchTab({ url: path })
  } else {
    Taro.navigateTo({ url: path })
  }
}

const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => (
  <View
    hoverClass="view-press"
    hoverStayTime="80"
    className="relative block rounded-2xl overflow-hidden shadow-card bg-white border border-mint-100"
    onClick={() => navigateToPage(tool.path)}
  >
    <View className={`h-24 bg-gradient-to-br ${tool.color} relative flex items-end p-4 overflow-hidden`}>
      <View className="absolute -right-4 -top-6 w-28 h-28 rounded-full bg-white/15" />
      <View className="absolute right-8 top-1 w-14 h-14 rounded-full bg-white/10" />
      <Text className="relative text-4xl leading-none">{tool.icon}</Text>
      {tool.badge && (
        <Text className="absolute top-3 right-3 text-[10px] bg-white/90 text-mint-700 font-semibold px-2 py-0.5 rounded-full shadow-sm">
          {tool.badge}
        </Text>
      )}
    </View>
    <View className="p-4">
      <View className="flex items-center justify-between">
        <Text className="font-semibold text-mint-900">{tool.name}</Text>
        <Text className="text-mint-400">›</Text>
      </View>
      <Text className="mt-1 block text-xs text-mint-700/70 leading-relaxed line-clamp-2">{tool.desc}</Text>
    </View>
  </View>
)

const Home: React.FC = () => {
  return (
    <View className="animate-fade-up px-4 pt-5 pb-8">
      {/* Hero */}
      <View className="mb-8">
        <View className="flex items-start justify-between gap-3">
          <View>
            <Text className="text-sm text-mint-700/70">{getGreeting()}</Text>
            <Text className="mt-1 block text-3xl font-bold text-mint-900 tracking-tight">芥菜种子 🌱</Text>
            <Text className="mt-2 block text-sm text-mint-800/80">
              办公工具箱 + 休闲小玩意儿，一个页面搞定你的摸鱼与专注。最小的种子，也能长成大树。
            </Text>
          </View>
        </View>
      </View>

      {/* 办公工具箱 */}
      <View className="mb-8">
        <View className="flex items-end justify-between mb-4">
          <View>
            <View className="inline-flex items-center px-3 py-1 rounded-full bg-mint-100 text-xs font-semibold">
              <Text className="text-mint-700">💼 办公工具箱</Text>
            </View>
            <Text className="mt-2 block text-xl font-bold text-mint-900">生产力小帮手</Text>
          </View>
          <Text className="text-xs text-mint-700/60">共 {officeTools.length} 个</Text>
        </View>
        <View className="grid grid-cols-2 gap-3">
          {officeTools.map((t) => (
            <ToolCard key={t.name} tool={t} />
          ))}
        </View>
      </View>

      {/* 休闲娱乐 */}
      <View>
        <View className="flex items-end justify-between mb-4">
          <View>
            <View className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-xs font-semibold">
              <Text className="text-pink-600">🎈 休闲娱乐</Text>
            </View>
            <Text className="mt-2 block text-xl font-bold text-mint-900">让生活可爱一点</Text>
          </View>
          <Text className="text-xs text-mint-700/60">共 {funTools.length} 个</Text>
        </View>
        <View className="grid grid-cols-2 gap-3">
          {funTools.map((t) => (
            <ToolCard key={t.name} tool={t} />
          ))}
        </View>
      </View>

      {/* 关于入口 */}
      <View className="mt-8 flex items-center justify-center gap-4 text-xs text-mint-700/60">
        <View hoverClass="view-press" hoverStayTime="80" onClick={showAbout}>
          <Text className="underline">ℹ️ 关于</Text>
        </View>
        <Text>·</Text>
        <Text>v{appConfig.version}</Text>
        <Text>·</Text>
        <Text className="flex items-center gap-1">
          Made with <Text className="text-rose-400">❤️</Text>
        </Text>
      </View>
    </View>
  )
}

export default Home
