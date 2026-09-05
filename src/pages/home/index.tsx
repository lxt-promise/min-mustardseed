import React, { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
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
    path: '/pages/verse/index',
    name: '治愈金句',
    desc: '随机圣经经文 · 中英对照',
    color: 'from-indigo-400 to-violet-500',
    badge: '✨ 推荐',
    icon: '✨',
  },
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

// TabBar 页面用 switchTab，普通页面用 navigateTo
const TabBarPages = ['/pages/home/index', '/pages/todo/index', '/pages/verse/index', '/pages/more/index']

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

interface MiniStats {
  pomodoroToday: number
  pomodoroTotal: number
  todoAll: number
  todoDone: number
}

const Home: React.FC = () => {
  const [greet, setGreet] = useState('你好')
  const [stats, setStats] = useState<MiniStats>({
    pomodoroToday: 0,
    pomodoroTotal: 0,
    todoAll: 0,
    todoDone: 0,
  })

  useEffect(() => {
    const h = new Date().getHours()
    setGreet(
      h < 6 ? '凌晨好' :
      h < 11 ? '早上好' :
      h < 13 ? '中午好' :
      h < 18 ? '下午好' : '晚上好'
    )

    // 加载实时统计
    try {
      const pomodoroData = storage.get<{ completedDates: Record<string, number>; totalFocus: number } | null>('mint.pomodoro.v1', null)
      const todoData = storage.get<{ done: boolean }[]>('mint.todo.v1', [])
      const todayKey = new Date().toISOString().slice(0, 10)
      setStats({
        pomodoroToday: pomodoroData?.completedDates?.[todayKey] ?? 0,
        pomodoroTotal: pomodoroData?.totalFocus ?? 0,
        todoAll: todoData.length,
        todoDone: todoData.filter(t => t.done).length,
      })
    } catch (e) {
      // ignore
    }
  }, [])

  return (
    <View className="animate-fade-up px-4 pt-5 pb-8">
      {/* Hero */}
      <View className="mb-6">
        <View className="flex items-start justify-between gap-3">
          <View>
            <Text className="text-sm text-mint-700/70">🌱 {greet}，今天也要开心呀</Text>
            <View className="mt-1 flex items-center gap-2">
              <Text className="text-3xl font-bold text-mint-900 tracking-tight">芥菜种子</Text>
              <Text className="text-3xl">🌱</Text>
            </View>
            <Text className="mt-2 block text-sm text-mint-800/80">办公工具箱 + 休闲小玩意儿，一个页面搞定你的摸鱼与专注。</Text>
          </View>
        </View>
      </View>

      {/* 今日数据 */}
      <View className="mb-6 rounded-2xl bg-gradient-to-br from-mint-500 via-mint-600 to-teal-600 p-4 shadow-soft">
        <Text className="text-xs text-white/80">📊 今日概览</Text>
        <View className="mt-2 grid grid-cols-3 gap-2">
          <View className="text-center">
            <Text className="text-2xl font-bold text-white">{stats.pomodoroToday}</Text>
            <Text className="text-[10px] text-white/85 mt-0.5">🍅 今日番茄</Text>
          </View>
          <View className="text-center border-l border-r border-white/20">
            <Text className="text-2xl font-bold text-white">{stats.todoAll - stats.todoDone}</Text>
            <Text className="text-[10px] text-white/85 mt-0.5">✅ 待办未完成</Text>
          </View>
          <View className="text-center">
            <Text className="text-2xl font-bold text-white">{stats.pomodoroTotal}</Text>
            <Text className="text-[10px] text-white/85 mt-0.5">📈 累计番茄</Text>
          </View>
        </View>
      </View>

      {/* 办公工具箱 */}
      <View className="mb-6">
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
