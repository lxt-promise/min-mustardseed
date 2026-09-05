import React, { useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import {
  TABS, COLOR_CHOICES, BUCKETS, JOKES, ADVICE_CARDS,
  matchBucket, type Mode, type ColorChoice, type Bucket,
} from '@/data/quiz'
import CopyBtn from '@/components/CopyBtn'
import './index.scss'

/**
 * 趣味小测试 v3（小程序版）
 *  - 颜色性格：6 个预设 + 中文颜色名输入（模糊匹配 13 大类）
 *  - 笑一个吧：24 条中文笑话随机
 *  - 人生锦囊：36 条人生建议卡
 */

const Quiz: React.FC = () => {
  const [tab, setTab] = useState<Mode>('color')
  return (
    <View className="animate-fade-up px-4 pt-4 pb-8 flex flex-col gap-5">
      <View className="grid grid-cols-3 gap-2 rounded-2xl p-1 bg-mint-100 border border-mint-100 shadow-card">
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <View
              key={t.key}
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={() => setTab(t.key)}
              className={`rounded-xl py-2.5 px-2 ${active ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className="block text-lg leading-none mb-1 text-center">{t.icon}</Text>
              <Text className={`block text-xs font-semibold text-center ${active ? 'text-mint-800' : 'text-mint-700/70'}`}>{t.label}</Text>
            </View>
          )
        })}
      </View>
      {tab === 'color' && <ColorPanel />}
      {tab === 'joke'  && <JokePanel />}
      {tab === 'advice' && <AdvicePanel />}
    </View>
  )
}

// ============ 颜色性格 ============
function ColorPanel() {
  const [nameInput, setNameInput] = useState('')
  const [customPicked, setCustomPicked] = useState<null | { bucket: Bucket; inputName: string; matchedKeyword: string }>(null)
  const [presetPicked, setPresetPicked] = useState<ColorChoice | null>(null)
  const [errMsg, setErrMsg] = useState('')

  const result = useMemo(() => {
    if (presetPicked) {
      return {
        hex: presetPicked.hex,
        displayCls: presetPicked.cls,
        name: presetPicked.name,
        trait: presetPicked.trait,
        desc: presetPicked.desc,
        bucketHint: '',
      }
    }
    if (customPicked) {
      const b = customPicked.bucket
      return {
        hex: b.hex,
        displayCls: b.cls,
        name: `${customPicked.inputName}（${b.bucket}）`,
        trait: b.trait,
        desc: b.desc,
        bucketHint: `※「${customPicked.inputName}」自动归入大类：${b.bucket}`,
      }
    }
    return null
  }, [presetPicked, customPicked])

  const shareText = result
    ? `🎨 我的颜色性格测试
颜色：${result.name}
性格关键词：${result.trait}
${result.desc}
—— 来自「薄荷小站」趣味小测试 ✨`
    : ''

  function applyInput() {
    const name = nameInput.trim()
    if (!name) { setErrMsg('先输入一个颜色名，例如「抹茶绿」、「雾霾蓝」'); return }
    const m = matchBucket(name)
    if (!m) {
      setErrMsg(`没识别出「${name}」属于哪种颜色，换个说法试试？比如把「酱紫」改成「紫色」。`)
      setCustomPicked(null)
      return
    }
    setErrMsg('')
    setCustomPicked({ bucket: m.bucket, inputName: name, matchedKeyword: m.matchedKeyword })
    setPresetPicked(null)
  }

  return (
    <View className="flex flex-col gap-4">
      <View className="rounded-2xl bg-white/70 border border-mint-100 shadow-card p-4">
        <Text className="text-xs text-mint-700/70">点预设色块，或输入你最喜欢的颜色名</Text>
        <Text className="block mt-0.5 text-lg font-bold text-mint-900">颜色揭示你的性格</Text>
      </View>

      <View className="grid grid-cols-3 gap-3">
        {COLOR_CHOICES.map(c => (
          <View
            key={c.key}
            hoverClass="view-press"
            hoverStayTime="80"
            onClick={() => { setPresetPicked(c); setCustomPicked(null); setErrMsg('') }}
            className={`h-24 rounded-2xl ${c.cls} border-2 shadow-card flex flex-col items-end justify-end p-2 relative overflow-hidden
              ${presetPicked?.key === c.key && !customPicked ? 'ring-4 ring-offset-2 ring-mint-400' : ''}`}
          >
            <Text className="text-white font-bold leading-tight">{c.name}</Text>
          </View>
        ))}
      </View>

      {/* 中文颜色名输入 */}
      <View className="rounded-2xl bg-white border border-mint-100 shadow-card p-4 flex flex-col gap-3">
        <Text className="text-sm font-semibold text-mint-800">🎛️ 输入颜色中文名</Text>
        <ColorInput
          value={nameInput}
          onChange={(v) => { setNameInput(v); if (errMsg) setErrMsg('') }}
          onSubmit={applyInput}
        />
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          onClick={applyInput}
          className="px-4 py-2.5 rounded-xl bg-mint-600 shadow-soft flex items-center justify-center"
        >
          <Text className="text-sm text-white font-semibold">🔍 看看我的性格</Text>
        </View>
        {errMsg !== '' && (
          <Text className="text-[12px] text-rose-500">⚠️ {errMsg}</Text>
        )}
        <Text className="text-[11px] text-mint-700/60 leading-relaxed">
          💡 不必精确，写你心里对它的「叫法」就好 —— 奶咖、雾霾蓝、樱花粉、落日橘、藏青、藕粉、鸭屎绿…通通可以；
          模糊颜色会自动归入 13 个大类，显示大类对应的代表性颜色与性格描述。
        </Text>
        <View className="flex flex-wrap gap-1.5 pt-1">
          {BUCKETS.map(b => (
            <View key={b.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full shadow-sm ${b.cls}`}>
              <View className="w-2 h-2 rounded-full bg-white/80" />
              <Text className="text-[11px] text-white/95">{b.bucket}</Text>
            </View>
          ))}
        </View>
      </View>

      {result && (
        <View className="rounded-2xl bg-white border border-mint-100 shadow-card p-5 animate-pop flex flex-col gap-3">
          <View className="flex items-center gap-4">
            <View className={`w-20 h-20 rounded-2xl shrink-0 shadow-soft ${result.displayCls}`} />
            <View className="min-w-0 flex-1">
              <Text className="block text-xl font-bold text-mint-900">{result.name}</Text>
              <Text className="block text-sm text-mint-600 font-semibold mt-0.5">{result.trait}</Text>
              {result.bucketHint !== '' && (
                <Text className="block text-[11px] text-mint-500 mt-1">{result.bucketHint}</Text>
              )}
            </View>
          </View>
          <View className="text-sm leading-8 bg-mint-50 border border-mint-100 rounded-xl p-4">
            <Text className="text-mint-900 whitespace-pre-line">{result.desc}</Text>
          </View>
          <CopyBtn text={shareText} block />
        </View>
      )}
    </View>
  )
}

// Input 简易封装（小程序 Input 的 value/placeholder 样式）
function ColorInput(props: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  return (
    <View className="rounded-xl border border-mint-100 bg-mint-50/50 px-3 py-2">
      <Input
        value={props.value}
        placeholder="例如：薄荷绿 / 奶茶色 / 雾霾蓝 / 樱花粉"
        placeholderClass="text-mint-700/40"
        onInput={e => props.onChange(e.detail.value)}
        onConfirm={() => props.onSubmit()}
        confirmType="done"
      />
    </View>
  )
}

// ============ 笑话 ============
function JokePanel() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * JOKES.length))
  const [animKey, setAnimKey] = useState(0)
  const j = JOKES[idx]
  const next = () => {
    let n = Math.floor(Math.random() * JOKES.length)
    if (n === idx) n = (n + 1) % JOKES.length
    setIdx(n); setAnimKey(k => k + 1)
  }
  const shareText =
`😄 今天这个笑话我给满分（第 ${idx+1} 则）
《${j.t}》
${j.s}
—— 笑一个吧 · 薄荷小站 ✨`

  return (
    <View className="flex flex-col gap-4">
      <View className="flex items-end justify-between gap-3 rounded-2xl bg-white/70 border border-mint-100 shadow-card p-4">
        <View>
          <Text className="block text-xs text-mint-700/70">共 {JOKES.length} 则笑话池，来点轻松的？</Text>
          <Text className="block mt-0.5 text-lg font-bold text-mint-900">笑一个吧 😆</Text>
        </View>
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          onClick={next}
          className="text-xs px-3 py-1.5 rounded-full bg-rose-500 shadow-soft"
        >
          <Text className="text-white font-semibold">🎲 换一个</Text>
        </View>
      </View>
      <View key={animKey} className="animate-pop rounded-3xl bg-gradient-to-br from-amber-300 via-rose-300 to-fuchsia-400 p-0.5 shadow-soft">
        <View className="rounded-3xl bg-white/95 p-6">
          <Text className="block text-[11px] tracking-widest text-rose-600 font-semibold">— JOKE #{String(idx+1).padStart(2,'0')} —</Text>
          <Text className="block mt-4 text-2xl font-black text-mint-900 tracking-wide leading-tight">《{j.t}》</Text>
          <View className="mt-5 text-base leading-9">
            <Text className="text-mint-800 whitespace-pre-line">{j.s}</Text>
          </View>
          <View className="mt-6 flex items-end justify-between gap-2">
            <Text className="text-5xl opacity-30">🤣</Text>
            <Text className="text-xs text-mint-700/70 max-w-[55%] text-right leading-relaxed">要是没笑，点 🎲 再来一个。心情就像巧克力，下一颗总不一样。</Text>
          </View>
        </View>
      </View>
      <CopyBtn text={shareText} block />
    </View>
  )
}

// ============ 人生锦囊 ============
function AdvicePanel() {
  const [idx, setIdx] = useState<number>(() => Math.floor(Math.random() * ADVICE_CARDS.length))
  const [animKey, setAnimKey] = useState(0)
  const card = ADVICE_CARDS[idx]
  const shareText =
`🀄 我今日抽到的人生建议：
《${card.t}》
${card.s}
—— 来自「芥菜种子」${ADVICE_CARDS.length} 张人生锦囊 ✨`
  function next() {
    let n = Math.floor(Math.random() * ADVICE_CARDS.length)
    if (n === idx) n = (n + 1) % ADVICE_CARDS.length
    setIdx(n); setAnimKey(k => k + 1)
  }
  return (
    <View className="flex flex-col gap-4">
      <View className="flex items-end justify-between gap-3 rounded-2xl bg-white/70 border border-mint-100 shadow-card p-4">
        <View>
          <Text className="block text-xs text-mint-700/70">共 {ADVICE_CARDS.length} 张锦囊，今天交给哪一张？</Text>
          <Text className="block mt-0.5 text-lg font-bold text-mint-900">今日人生建议</Text>
        </View>
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          onClick={next}
          className="text-xs px-3 py-1.5 rounded-full bg-rose-500 shadow-soft"
        >
          <Text className="text-white font-semibold">🎴 换一张</Text>
        </View>
      </View>
      <View key={animKey} className="animate-pop rounded-3xl bg-gradient-to-br from-rose-400 via-amber-300 to-mint-400 p-0.5 shadow-soft">
        <View className="rounded-3xl bg-white/95 p-6 text-center">
          <Text className="block text-[11px] tracking-widest text-mint-600 font-semibold">— LIFE ADVICE · NO.{String(idx+1).padStart(2,'0')} —</Text>
          <Text className="block mt-5 text-3xl font-black text-mint-900 tracking-wide leading-tight">{card.t}</Text>
          <Text className="block mt-5 text-base leading-9 text-mint-800/95 px-2">{card.s}</Text>
          <Text className="block mt-8 text-7xl opacity-30">🌿</Text>
        </View>
      </View>
      <CopyBtn text={shareText} block />
    </View>
  )
}

export default Quiz
