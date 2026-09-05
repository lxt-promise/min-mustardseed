import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
import './index.scss'

// 内置模板：选菜 / 喝点什么 / 周末去哪 / 二选一 / 抛硬币 / 掷骰子
type Preset = {
  id: string
  name: string
  icon: string
  hint?: string
  options: string[]
}

const PRESETS: Preset[] = [
  {
    id: 'food',
    name: '今天吃什么',
    icon: '🍜',
    hint: '选择困难症的救星',
    options: [
      '兰州拉面', '沙县小吃', '麻辣烫', '黄焖鸡米饭', '麦当劳', '肯德基',
      '重庆小面', '火锅', '烤肉', '寿司', '日料定食', '韩式拌饭',
      '螺蛳粉', '盖浇饭', '粥+包子', '饺子', '炒饭', '披萨',
      '沙拉轻食', '汉堡王', '便利店饭团', '海底捞', '川菜', '湘菜',
      '粤菜', '牛肉面', '肉夹馍', '外卖随便一家', '自己做饭🍳',
    ],
  },
  {
    id: 'drink',
    name: '喝点什么',
    icon: '🧋',
    options: [
      '美式咖啡', '拿铁', '摩卡', '卡布奇诺',
      '奶茶（三分糖）', '杨枝甘露', '柠檬水',
      '纯茶（乌龙/绿茶）', '可乐', '雪碧',
      '矿泉水', '椰子水', '果汁', '气泡水',
      '珍珠奶茶', '生椰拿铁', '热巧克力',
    ],
  },
  {
    id: 'weekend',
    name: '周末去哪',
    icon: '🎡',
    options: [
      '宅家追剧', '睡到自然醒', '去公园散步', '看电影',
      '逛超市', '逛书店', '咖啡馆办公', '爬山',
      '约朋友吃饭', '博物馆/美术馆', '健身房',
      '图书馆自习', '近郊旅行', '在家做大餐',
      '逛街买买买', '宅家打游戏', '看展览',
    ],
  },
  {
    id: 'yesno',
    name: '做不做？',
    icon: '🤔',
    hint: '二选一：是 / 否',
    options: ['✅ 去做！', '❌ 再等等'],
  },
  {
    id: 'coin',
    name: '抛硬币',
    icon: '🪙',
    options: ['正面 ✨', '反面 🌙'],
  },
  {
    id: 'dice',
    name: '掷骰子',
    icon: '🎲',
    options: ['1 点', '2 点', '3 点', '4 点', '5 点', '6 点'],
  },
]

const RECENT_KEY = 'mint.picker.recent.v1'

const Picker: React.FC = () => {
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id)
  const [custom, setCustom] = useState<string[]>([])
  const [isCustom, setIsCustom] = useState(false)
  const [input, setInput] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>(() => storage.get<string[]>(RECENT_KEY, []))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { storage.set(RECENT_KEY, history.slice(0, 30)) }, [history])
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const preset = useMemo(() => PRESETS.find(p => p.id === presetId) ?? PRESETS[0], [presetId])

  const opts: string[] = isCustom ? custom : preset.options

  const pickOnce = () => opts[Math.floor(Math.random() * opts.length)]

  function startSpin() {
    if (opts.length < 2) {
      Taro.showToast({ title: '至少需要两个选项才可以开始抽哦～', icon: 'none' })
      return
    }
    setResult(null)
    setSpinning(true)
    const total = 1600
    const start = Date.now()
    let delay = 50
    const tick = () => {
      const elapsed = Date.now() - start
      setResult(pickOnce())
      if (elapsed >= total) {
        const finalResult = pickOnce()
        setResult(finalResult)
        setSpinning(false)
        setHistory((h) => [
          `${isCustom ? '🎯 自定义' : preset.icon + ' ' + preset.name}：${finalResult}`,
          ...h,
        ].slice(0, 30))
        return
      }
      // 逐步减速
      delay = 50 + (elapsed / total) * 180
      timerRef.current = setTimeout(tick, delay)
    }
    tick()
  }

  function stopSpin() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setSpinning(false)
  }

  function addCustomOption() {
    const v = input.trim()
    if (!v) return
    if (custom.includes(v)) { setInput(''); return }
    setCustom([...custom, v])
    setInput('')
    setIsCustom(true)
  }

  function removeCustom(i: number) {
    setCustom(custom.filter((_, idx) => idx !== i))
  }

  function usePreset(id: string) {
    setPresetId(id)
    setIsCustom(false)
    setResult(null)
    stopSpin()
  }

  function goCustom() {
    setIsCustom(true)
    setResult(null)
    stopSpin()
  }

  function loadQuickPreset(n: number) {
    const placeholders = ['选项 A', '选项 B', '选项 C', '选项 D', '选项 E', '选项 F'].slice(0, n)
    setCustom(placeholders)
    setIsCustom(true)
    setResult(null)
  }

  function clearHistory() {
    Taro.showModal({
      title: '清空最近记录？',
      confirmColor: '#1a9464',
      success: (res) => { if (res.confirm) setHistory([]) },
    })
  }

  return (
    <View className="animate-fade-up pt-4 pb-8">
      {/* Preset grid */}
      <View className="grid grid-cols-3 gap-2.5">
        {PRESETS.map(p => {
          const active = !isCustom && p.id === presetId
          return (
            <View
              key={p.id}
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={() => usePreset(p.id)}
              className={`rounded-2xl p-3 border bg-white/90 shadow-card ${active ? 'border-mint-500' : 'border-mint-100'}`}
            >
              <Text className="block text-2xl leading-none">{p.icon}</Text>
              <Text className={`block mt-2 text-sm font-semibold ${active ? 'text-mint-700' : 'text-mint-900'}`}>{p.name}</Text>
              <Text className="block mt-0.5 text-[11px] text-mint-700/60 line-clamp-1">
                {p.hint ?? `${p.options.length} 个选项`}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Custom mode switch */}
      <View className="mt-4 rounded-2xl bg-white/90 border border-mint-100 shadow-card p-4">
        <View className="flex items-center justify-between">
          <View>
            <Text className="block text-sm font-semibold text-mint-900">🎯 自定义选项</Text>
            <Text className="block text-xs text-mint-700/60 mt-0.5">自己输入，想抽啥抽啥</Text>
          </View>
          <View className="flex items-center gap-1.5">
            {[2, 3, 4, 6].map(n => (
              <View
                key={n}
                hoverClass="view-press"
                hoverStayTime="80"
                onClick={() => loadQuickPreset(n)}
                className="text-[11px] px-2 py-1 rounded-lg bg-mint-50 border border-mint-100"
              >
                <Text className="text-mint-700">{n}选1</Text>
              </View>
            ))}
            <View
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={goCustom}
              className={`text-[12px] px-3 py-1.5 rounded-lg border ${isCustom ? 'bg-mint-600 border-mint-600' : 'bg-white border-mint-200'}`}
            >
              <Text className={isCustom ? 'text-white' : 'text-mint-700'}>{isCustom ? '编辑中' : '去编辑'}</Text>
            </View>
          </View>
        </View>

        {isCustom && (
          <View className="mt-3 animate-fade-up">
            <View className="flex items-center gap-2">
              <Input
                value={input}
                onInput={e => setInput(e.detail.value)}
                onConfirm={addCustomOption}
                placeholder="输入一个选项，点添加"
                placeholderClass="picker-placeholder"
                className="flex-1 bg-mint-50/50 rounded-xl px-3 py-2 text-sm"
              />
              <View
                hoverClass="view-press"
                hoverStayTime="80"
                onClick={addCustomOption}
                className="px-3.5 py-2 rounded-xl bg-mint-600"
              >
                <Text className="text-white text-sm font-semibold">添加</Text>
              </View>
            </View>
            <View className="mt-3 flex flex-wrap gap-2">
              {custom.length === 0 && (
                <Text className="text-xs text-mint-700/50 py-2">还没有选项，先在上方添加吧～</Text>
              )}
              {custom.map((c, i) => (
                <View key={i} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-mint-50 border border-mint-100">
                  <Text className="text-mint-800 text-sm">{c}</Text>
                  <View
                    hoverClass="view-press"
                    hoverStayTime="80"
                    onClick={() => removeCustom(i)}
                    className="w-5 h-5 rounded-full bg-white flex items-center justify-center"
                  >
                    <Text className="text-mint-400 text-xs leading-none">×</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Draw area */}
      <View className="mt-5">
        <View className={`relative rounded-3xl p-8 border bg-gradient-to-br from-mint-50 to-white shadow-card overflow-hidden ${spinning ? 'border-mint-300' : 'border-mint-100'}`}>
          <View className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-mint-200/40 blur-2xl" />
          <View className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-emerald-100/60 blur-2xl" />
          <View className="relative text-center min-h-[160px] flex items-center justify-center">
            {!result && !spinning && (
              <View>
                <Text className="block text-5xl mb-3">🎯</Text>
                <Text className="text-mint-700/60 text-sm">
                  当前共 {opts.length} 个选项 · 点下面按钮开始
                </Text>
              </View>
            )}
            {result && (
              <View key={result + (spinning ? 's' : 'e')} className={spinning ? 'animate-shake' : 'animate-pop'}>
                <Text className={`block text-[11px] tracking-widest ${spinning ? 'text-mint-500' : 'text-mint-600'}`}>
                  {spinning ? '抽取中…' : '✨ 就是你啦'}
                </Text>
                <Text className="block mt-3 text-4xl font-bold text-mint-800 leading-tight break-all">{result}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="mt-4 flex items-center justify-center gap-3">
          {!spinning ? (
            <View
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={startSpin}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-br from-mint-500 to-mint-700 shadow-soft"
            >
              <Text className="text-white font-semibold text-lg">🎲 开始抽</Text>
            </View>
          ) : (
            <View
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={stopSpin}
              className="px-8 py-3.5 rounded-2xl bg-white border border-mint-200 shadow-card"
            >
              <Text className="text-mint-700 font-semibold text-lg">立即停</Text>
            </View>
          )}
        </View>
      </View>

      {/* History */}
      {history.length > 0 && (
        <View className="mt-6">
          <View className="flex items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-mint-800">� 最近抽取记录</Text>
            <View hoverClass="view-press" hoverStayTime="80" onClick={clearHistory}>
              <Text className="text-[11px] text-mint-500">清空</Text>
            </View>
          </View>
          <View className="rounded-2xl bg-white/80 border border-mint-100 shadow-card overflow-hidden">
            {history.slice(0, 10).map((h, i) => (
              <View key={i} className={`px-4 py-2.5 flex items-center gap-2 ${i > 0 ? 'border-t border-mint-50' : ''}`}>
                <Text className="text-mint-400 text-xs w-6 shrink-0">{history.length - i}</Text>
                <Text className="text-sm text-mint-800 line-clamp-1">{h}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

export default Picker
