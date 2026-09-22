import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
import { playFinishChime } from '@/utils/audio'
import './index.scss'

/**
 * 番茄钟 v2（小程序版，对齐网页版设计）
 *  - 三种模式：专注 / 短休息 / 长休息
 *  - 细圆环倒计时 + 圆形控制按钮
 *  - 今日 / 累计两栏统计
 *  - 数字设置面板：时长、每日目标、提示音、自动下一阶段
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

const MODES: { key: Mode; label: string; tip: string }[] = [
  { key: 'focus', label: '专注', tip: '全情投入' },
  { key: 'short', label: '短休息', tip: '站起来动一下' },
  { key: 'long',  label: '长休息', tip: '喝杯茶 ☕' },
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
    setRunning((r) => !r)
  }

  function resetTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    const m = mode === 'focus' ? settings.focusMin : mode === 'short' ? settings.shortMin : settings.longMin
    setSeconds(m * 60)
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

  // 细圆环：conic-gradient 彩色进度 + 内白圆遮出环宽
  const arc = Math.round(progress * 360)
  const ringColor =
    mode === 'focus' ? '#fb7185' :
    mode === 'short' ? '#1a9464' : '#818cf8'
  const ringGrad = `conic-gradient(${ringColor} 0deg ${arc}deg, #d9f5e8 ${arc}deg 360deg)`

  const bgBtnClass =
    mode === 'focus' ? 'bg-rose-500' :
    mode === 'short' ? 'bg-mint-600' : 'bg-indigo-500'

  const modeMin = (m: Mode) =>
    m === 'focus' ? settings.focusMin : m === 'short' ? settings.shortMin : settings.longMin

  return (
    <View className="animate-fade-up pt-4 pb-8 px-4 flex flex-col">
      {/* 模式切换 */}
      <View className="flex p-1 rounded-2xl bg-white/80 border border-mint-100 shadow-card">
        {MODES.map((m) => {
          const active = mode === m.key
          return (
            <View
              key={m.key}
              hoverClass={running ? 'none' : 'view-press'}
              hoverStayTime="80"
              onClick={() => { if (!running) setMode(m.key) }}
              className={`flex-1 py-2.5 rounded-xl flex flex-col items-center transition-all ${active ? 'bg-mint-600 shadow-sm' : ''} ${running ? 'opacity-60' : ''}`}
            >
              <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-mint-800/70'}`}>{m.label}</Text>
              <Text className={`text-[10px] mt-0.5 ${active ? 'text-white/90' : 'text-mint-700/50'}`}>
                {modeMin(m.key)} 分钟
              </Text>
            </View>
          )
        })}
      </View>

      {/* 细圆环倒计时 */}
      <View className="mt-8 flex justify-center">
        <View className="relative w-72 h-72 rounded-full" style={{ background: ringGrad }}>
          <View className="absolute inset-[6px] rounded-full bg-white flex flex-col items-center justify-center">
            <Text className="text-xs text-mint-600 font-medium tracking-widest">
              {MODES.find((m) => m.key === mode)?.tip}
            </Text>
            <Text className="mt-2 text-6xl font-bold text-mint-900 tracking-tight">{timeText}</Text>
            <Text className="mt-3 text-xs text-mint-700/70">
              第 {todayDone + (running && mode === 'focus' ? 1 : 0)} 个 · 目标 {settings.dailyGoal} 个番茄
            </Text>
          </View>
        </View>
      </View>

      {/* 圆形控制按钮 */}
      <View className="mt-6 flex items-center justify-center gap-4">
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          onClick={resetTimer}
          className="w-14 h-14 rounded-full bg-white border border-mint-100 shadow-card flex items-center justify-center"
        >
          <Text className="text-2xl text-mint-700 leading-none">↺</Text>
        </View>
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          onClick={toggleRun}
          className={`w-20 h-20 rounded-full ${bgBtnClass} shadow-soft flex items-center justify-center`}
        >
          <Text className="text-4xl text-white leading-none">
            {running ? '⏸' : '▶'}
          </Text>
        </View>
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          onClick={skipNext}
          className="w-14 h-14 rounded-full bg-white border border-mint-100 shadow-card flex items-center justify-center"
        >
          <Text className="text-2xl text-mint-700 leading-none">⏭</Text>
        </View>
      </View>

      {/* 两栏统计 */}
      <View className="mt-8 grid grid-cols-2 gap-3">
        <View className="rounded-2xl p-4 bg-white/80 border border-mint-100 shadow-card">
          <Text className="text-xs text-mint-700/70">今日番茄</Text>
          <View className="mt-1 flex items-baseline gap-1">
            <Text className="text-3xl font-bold text-mint-900">{todayDone}</Text>
            <Text className="text-sm text-mint-700/60">/ {settings.dailyGoal}</Text>
          </View>
          <View className="mt-2 h-2 rounded-full bg-mint-100 overflow-hidden">
            <View
              className="h-full bg-gradient-to-r from-mint-500 to-mint-400"
              style={{ width: `${goalPct}%` }}
            />
          </View>
        </View>
        <View className="rounded-2xl p-4 bg-white/80 border border-mint-100 shadow-card">
          <Text className="text-xs text-mint-700/70">累计专注</Text>
          <View className="mt-1 flex items-baseline gap-1">
            <Text className="text-3xl font-bold text-mint-900">{totalFocus}</Text>
            <Text className="text-sm text-mint-700/60">个番茄</Text>
          </View>
          <Text className="mt-2 text-xs text-mint-700/60">
            ≈ {totalFocus * settings.focusMin} 分钟的认真时刻 🌟
          </Text>
        </View>
      </View>

      {/* 设置入口 */}
      <View
        hoverClass="view-press"
        hoverStayTime="80"
        onClick={() => setShowSettings((s) => !s)}
        className="mt-4 w-full rounded-xl py-3 bg-mint-50/70 border border-mint-100 flex items-center justify-center gap-2"
      >
        <Text className="text-sm text-mint-700">⚙️ 设置</Text>
      </View>

      {/* 设置面板 */}
      {showSettings && (
        <View className="mt-4 p-4 rounded-2xl bg-white/90 border border-mint-100 shadow-card animate-fade-up flex flex-col gap-3">
          <View className="grid grid-cols-3 gap-3">
            <NumberField label="专注（分钟）" value={settings.focusMin} min={1} max={90}
              onChange={(v) => setSettings({ ...settings, focusMin: v })} />
            <NumberField label="短休息" value={settings.shortMin} min={1} max={60}
              onChange={(v) => setSettings({ ...settings, shortMin: v })} />
            <NumberField label="长休息" value={settings.longMin} min={1} max={60}
              onChange={(v) => setSettings({ ...settings, longMin: v })} />
          </View>
          <View className="grid grid-cols-2 gap-3">
            <NumberField label="每日目标（个）" value={settings.dailyGoal} min={1} max={30}
              onChange={(v) => setSettings({ ...settings, dailyGoal: v })} />
            <View className="flex items-center justify-between rounded-xl bg-mint-50/60 px-3 py-2 border border-mint-100">
              <Text className="text-xs text-mint-800">提示音</Text>
              <Toggle checked={settings.soundOn} onChange={(v) => setSettings({ ...settings, soundOn: v })} />
            </View>
          </View>
          <View className="flex items-center justify-between rounded-xl bg-mint-50/60 px-3 py-2 border border-mint-100">
            <Text className="text-sm text-mint-800">自动进入下一阶段</Text>
            <Toggle checked={settings.autoNext} onChange={(v) => setSettings({ ...settings, autoNext: v })} />
          </View>
          <Text className="text-[11px] text-mint-700/60">
            * 每完成 4 个专注番茄后会自动进入长休息，其他时候进入短休息。
          </Text>
        </View>
      )}
    </View>
  )
}

const NumberField: React.FC<{
  label: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
}> = ({ label, value, min, max, onChange }) => (
  <View className="rounded-xl bg-mint-50/60 px-3 py-2 border border-mint-100">
    <Text className="text-[11px] text-mint-700/80">{label}</Text>
    <Input
      type="number"
      value={String(value)}
      onInput={(e) => {
        const n = parseInt(e.detail.value, 10)
        if (isFinite(n)) onChange(Math.max(min, Math.min(max, n)))
      }}
      className="mt-0.5 w-full text-lg font-semibold text-mint-900"
    />
  </View>
)

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <View
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-mint-500' : 'bg-gray-300'}`}
  >
    <View className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
  </View>
)

export default Pomodoro
