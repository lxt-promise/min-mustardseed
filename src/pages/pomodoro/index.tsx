import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Switch, Slider, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
import { playFinishChime } from '@/utils/audio'
import './index.scss'

/**
 * 番茄钟 v1（小程序版）
 *  - 三种模式：专注 / 短休息 / 长休息
 *  - 自定义时长、提示音、自动切换
 *  - 每日番茄完成数 + 累计统计
 */

type Mode = 'focus' | 'short' | 'long'

interface Settings {
  focusMin: number
  shortMin: number
  longMin: number
  autoNext: boolean
  soundOn: boolean
  dailyGoal: number
}

const STORAGE_KEY = 'mint.pomodoro.v1'
const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  autoNext: false,
  soundOn: true,
  dailyGoal: 8,
}

const MODES: { key: Mode; label: string; tip: string; icon: string }[] = [
  { key: 'focus', label: '专注', tip: '全情投入', icon: '🍅' },
  { key: 'short', label: '短休息', tip: '站起来动一下', icon: '☕' },
  { key: 'long', label: '长休息', tip: '喝杯茶', icon: '🌿' },
]

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0')

const Pomodoro: React.FC = () => {
  const saved = storage.get<{
    settings: Settings
    completedDates: Record<string, number>
    totalFocus: number
  } | null>(STORAGE_KEY, null)

  const [settings, setSettings] = useState<Settings>(saved?.settings ?? DEFAULT_SETTINGS)
  const [completedDates, setCompletedDates] = useState<Record<string, number>>(saved?.completedDates ?? {})
  const [totalFocus, setTotalFocus] = useState<number>(saved?.totalFocus ?? 0)

  const [mode, setMode] = useState<Mode>('focus')
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(() => (saved?.settings?.focusMin ?? DEFAULT_SETTINGS.focusMin) * 60)
  const [showSettings, setShowSettings] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 持久化
  useEffect(() => {
    storage.set(STORAGE_KEY, { settings, completedDates, totalFocus })
  }, [settings, completedDates, totalFocus])

  // 模式或时长变化时，重置倒计时（仅在未运行时）
  useEffect(() => {
    if (running) return
    const m = mode === 'focus' ? settings.focusMin : mode === 'short' ? settings.shortMin : settings.longMin
    setSeconds(m * 60)
  }, [mode, settings.focusMin, settings.shortMin, settings.longMin, running])

  // 计时器
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          finishOne()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  // 后台计时修正：进入前台时若倒计时已过完则直接收尾
  useEffect(() => {
    const onShow = () => {
      // 仅记录日志，不主动干预计时（小程序后台 setInterval 会暂停）
      // console.log('[Pomodoro] app show')
    }
    Taro.onAppShow(onShow)
    return () => Taro.offAppShow(onShow)
  }, [])

  function finishOne() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    playFinishChime(settings.soundOn)
    Taro.vibrateShort({ type: 'heavy' }).catch(() => {})

    if (mode === 'focus') {
      const today = new Date().toISOString().slice(0, 10)
      setCompletedDates((m) => ({ ...m, [today]: (m[today] ?? 0) + 1 }))
      setTotalFocus((t) => t + 1)
      Taro.showToast({ title: '🎉 完成一个番茄！', icon: 'none', duration: 1800 })
    }

    if (settings.autoNext) {
      const today = new Date().toISOString().slice(0, 10)
      const doneToday = (completedDates[today] ?? 0) + (mode === 'focus' ? 1 : 0)
      let nextMode: Mode
      if (mode === 'focus') nextMode = doneToday % 4 === 0 ? 'long' : 'short'
      else nextMode = 'focus'
      setMode(nextMode)
      const dur = nextMode === 'focus' ? settings.focusMin : nextMode === 'short' ? settings.shortMin : settings.longMin
      setSeconds(dur * 60)
      setRunning(true)
    } else {
      setRunning(false)
    }
  }

  function toggleRun() {
    if (running) {
      setRunning(false)
    } else {
      setRunning(true)
    }
  }

  function resetTimer() {
    if (running) {
      Taro.showModal({
        title: '重置计时器？',
        content: '当前正在进行中，确定要重置吗？',
        confirmColor: '#1a9464',
        success: (res) => {
          if (res.confirm) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setRunning(false)
            const m = mode === 'focus' ? settings.focusMin : mode === 'short' ? settings.shortMin : settings.longMin
            setSeconds(m * 60)
          }
        },
      })
    } else {
      const m = mode === 'focus' ? settings.focusMin : mode === 'short' ? settings.shortMin : settings.longMin
      setSeconds(m * 60)
    }
  }

  function skipNext() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setSeconds(0)
    finishOne()
  }

  const totalPerMode = (mode === 'focus' ? settings.focusMin : mode === 'short' ? settings.shortMin : settings.longMin) * 60
  const progress = totalPerMode === 0 ? 0 : 1 - seconds / totalPerMode
  const timeText = `${pad(seconds / 60)}:${pad(seconds % 60)}`

  const todayKey = new Date().toISOString().slice(0, 10)
  const todayDone = completedDates[todayKey] ?? 0
  const goalPct = Math.min(100, Math.round((todayDone / Math.max(1, settings.dailyGoal)) * 100))

  const colorClass =
    mode === 'focus' ? 'text-rose-500 border-rose-200' :
    mode === 'short' ? 'text-mint-600 border-mint-200' :
    'text-indigo-500 border-indigo-200'

  const bgBtnClass =
    mode === 'focus' ? 'bg-gradient-to-br from-rose-500 to-rose-600' :
    mode === 'short' ? 'bg-gradient-to-br from-mint-500 to-mint-700' :
    'bg-gradient-to-br from-indigo-500 to-indigo-600'

  const ringGrad =
    mode === 'focus' ? 'conic-gradient(from 0deg, #fb7185 0% ' + (progress * 360) + 'deg, #fee2e2 ' + (progress * 360) + 'deg 360deg)' :
    mode === 'short' ? 'conic-gradient(from 0deg, #1a9464 0% ' + (progress * 360) + 'deg, #d9f5e8 ' + (progress * 360) + 'deg 360deg)' :
    'conic-gradient(from 0deg, #818cf8 0% ' + (progress * 360) + 'deg, #e0e7ff ' + (progress * 360) + 'deg 360deg)'

  // 最近 7 天统计
  const last7 = useMemo(() => {
    const out: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      out.push({ date: key.slice(5), count: completedDates[key] ?? 0 })
    }
    return out
  }, [completedDates])

  const maxBar = Math.max(1, ...last7.map((d) => d.count))

  return (
    <View className="animate-fade-up pt-4 pb-8 px-4 flex flex-col gap-5">
      {/* 模式切换 */}
      <View className="rounded-2xl p-1 grid grid-cols-3 bg-mint-100 border border-mint-100 shadow-card">
        {MODES.map((m) => {
          const active = mode === m.key
          return (
            <View
              key={m.key}
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={() => { if (!running) setMode(m.key) }}
              className={`rounded-xl py-2.5 flex flex-col items-center ${active ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className="text-base">{m.icon}</Text>
              <Text className={`text-xs mt-0.5 font-semibold ${active ? 'text-mint-800' : 'text-mint-700/70'}`}>
                {m.label}
              </Text>
            </View>
          )
        })}
      </View>

      {/* 圆形进度计时器 */}
      <View className="rounded-3xl bg-white/80 border border-mint-100 shadow-card p-8 flex flex-col items-center">
        <View
          className={`relative w-72 h-72 rounded-full flex items-center justify-center border-4 ${colorClass}`}
          style={{ background: ringGrad }}
        >
          <View className="w-64 h-64 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
            <Text className="text-xs text-mint-700/70 mb-1">
              {MODES.find((m) => m.key === mode)?.tip}
            </Text>
            <Text className={`text-6xl font-bold tracking-tight ${mode === 'focus' ? 'text-rose-500' : mode === 'short' ? 'text-mint-600' : 'text-indigo-500'}`}>
              {timeText}
            </Text>
            <Text className="text-xs text-mint-700/60 mt-2">
              {running ? '进行中…' : '点击下方按钮开始'}
            </Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View className="mt-6 flex items-center gap-3 w-full">
          <View
            hoverClass="view-press"
            hoverStayTime="80"
            onClick={resetTimer}
            className="flex-1 py-3.5 rounded-2xl bg-white border border-mint-200 shadow-card flex items-center justify-center"
          >
            <Text className="text-mint-700 font-semibold">🔄 重置</Text>
          </View>
          <View
            hoverClass="view-press"
            hoverStayTime="80"
            onClick={toggleRun}
            className={`flex-[2] py-3.5 rounded-2xl ${bgBtnClass} shadow-soft flex items-center justify-center`}
          >
            <Text className="text-white font-bold text-lg">
              {running ? '⏸ 暂停' : seconds === 0 ? '⏭ 完成' : '▶ 开始'}
            </Text>
          </View>
          <View
            hoverClass="view-press"
            hoverStayTime="80"
            onClick={skipNext}
            className="flex-1 py-3.5 rounded-2xl bg-white border border-mint-200 shadow-card flex items-center justify-center"
          >
            <Text className="text-mint-700 font-semibold">⏭ 跳过</Text>
          </View>
        </View>
      </View>

      {/* 今日统计 */}
      <View className="rounded-2xl bg-white/80 border border-mint-100 shadow-card p-4">
        <View className="flex items-center justify-between mb-3">
          <Text className="text-sm font-semibold text-mint-800">📊 今日进度</Text>
          <Text className="text-xs text-mint-700/60">
            {todayDone} / {settings.dailyGoal} 番茄 · 累计 {totalFocus}
          </Text>
        </View>
        <View className="w-full h-3 rounded-full bg-mint-50 overflow-hidden">
          <View
            className="h-full rounded-full bg-gradient-to-r from-mint-400 to-mint-600 transition-all"
            style={{ width: `${goalPct}%` }}
          />
        </View>

        {/* 最近 7 天柱状图 */}
        <View className="mt-4">
          <Text className="text-xs text-mint-700/70 mb-2">最近 7 天</Text>
          <View className="flex items-end justify-between gap-1 h-16">
            {last7.map((d, i) => (
              <View key={i} className="flex-1 flex flex-col items-center gap-1">
                <Text className="text-[10px] text-mint-700/60">{d.count}</Text>
                <View
                  className="w-full rounded-t bg-gradient-to-t from-mint-500 to-mint-300"
                  style={{ height: `${Math.max(4, (d.count / maxBar) * 48)}px` }}
                />
                <Text className="text-[10px] text-mint-700/60">{d.date}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 设置按钮 */}
      <View
        hoverClass="view-press"
        hoverStayTime="80"
        onClick={() => setShowSettings(!showSettings)}
        className="rounded-2xl bg-white/70 border border-mint-100 shadow-card p-4 flex items-center justify-between"
      >
        <Text className="text-sm font-semibold text-mint-800">⚙️ 时长设置</Text>
        <Text className="text-xs text-mint-600">{showSettings ? '收起 ▲' : '展开 ▼'}</Text>
      </View>

      {showSettings && (
        <View className="rounded-2xl bg-white/80 border border-mint-100 shadow-card p-4 flex flex-col gap-4 animate-fade-up">
          <SettingRow
            label="🍅 专注时长"
            unit="分钟"
            value={settings.focusMin}
            min={5}
            max={60}
            onChange={(v) => setSettings({ ...settings, focusMin: v })}
          />
          <SettingRow
            label="☕ 短休息"
            unit="分钟"
            value={settings.shortMin}
            min={1}
            max={15}
            onChange={(v) => setSettings({ ...settings, shortMin: v })}
          />
          <SettingRow
            label="🌿 长休息"
            unit="分钟"
            value={settings.longMin}
            min={10}
            max={45}
            onChange={(v) => setSettings({ ...settings, longMin: v })}
          />
          <SettingRow
            label="🎯 每日目标"
            unit="个"
            value={settings.dailyGoal}
            min={1}
            max={20}
            onChange={(v) => setSettings({ ...settings, dailyGoal: v })}
          />
          <View className="flex items-center justify-between pt-2 border-t border-mint-50">
            <Text className="text-sm text-mint-800">🔔 提示音</Text>
            <Switch
              checked={settings.soundOn}
              color="#1a9464"
              onChange={(e) => setSettings({ ...settings, soundOn: e.detail.value })}
            />
          </View>
          <View className="flex items-center justify-between">
            <Text className="text-sm text-mint-800">⏭ 自动切换下一阶段</Text>
            <Switch
              checked={settings.autoNext}
              color="#1a9464"
              onChange={(e) => setSettings({ ...settings, autoNext: e.detail.value })}
            />
          </View>
        </View>
      )}
    </View>
  )
}

const SettingRow: React.FC<{
  label: string
  unit: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}> = ({ label, unit, value, min, max, onChange }) => (
  <View>
    <View className="flex items-center justify-between mb-1">
      <Text className="text-sm text-mint-800">{label}</Text>
      <Text className="text-sm font-semibold text-mint-700">{value} {unit}</Text>
    </View>
    <View className="flex items-center gap-2">
      <View
        hoverClass="view-press"
        hoverStayTime="80"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full bg-mint-50 border border-mint-200 flex items-center justify-center"
      >
        <Text className="text-mint-700 text-lg leading-none">−</Text>
      </View>
      <View className="flex-1 h-1 rounded-full bg-mint-100 relative">
        <View
          className="h-full rounded-full bg-mint-500"
          style={{ width: `${((value - min) / Math.max(1, max - min)) * 100}%` }}
        />
      </View>
      <View
        hoverClass="view-press"
        hoverStayTime="80"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full bg-mint-50 border border-mint-200 flex items-center justify-center"
      >
        <Text className="text-mint-700 text-lg leading-none">+</Text>
      </View>
    </View>
  </View>
)

export default Pomodoro
