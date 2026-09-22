import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Input, Slider } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
import { TRACK_URLS } from '@/config/audio'
import './index.scss'

/**
 * 音乐小站 v1（小程序版）
 *  - 三大分类：钢琴曲 / 白噪音 / 热门歌曲
 *  - 基于 Taro.createInnerAudioContext
 *  - 渐变通栏播放器 / 大卡片分类 / 搜索 / 收藏 / 进度跳转
 *  - 无 URL 曲目支持粘贴在线直链（mp3/wav）
 */

export interface Track {
  id: string
  title: string
  artist: string
  category: 'piano' | 'whitenoise' | 'hot'
  coverColor?: number // 渐变配色索引 0-3
  url?: string
  duration?: number // 秒
  favorite?: boolean
  addedAt?: number
}

// audio.ts 为只读：当前 TRACK_URLS 可能为空对象，本地做一次可选键类型收窄
const BUILTIN_URLS = TRACK_URLS as Partial<Record<
  'pianoCanon' | 'pianoFurElise' | 'pianoMoonlight' | 'ambRain' | 'ambForest' | 'ambCafe',
  string
>>

const CATS: { key: Track['category']; label: string; icon: string; hint: string; default: Omit<Track, 'id' | 'addedAt'>[] }[] = [
  {
    key: 'piano', label: '钢琴曲', icon: '🎹', hint: '平静思绪 · 灵感写作',
    default: [
      { title: '卡农 D 大调', artist: 'Pachelbel · 钢琴合成', category: 'piano', coverColor: 0, url: BUILTIN_URLS.pianoCanon },
      { title: '致爱丽丝', artist: 'Beethoven · 钢琴合成', category: 'piano', coverColor: 1, url: BUILTIN_URLS.pianoFurElise },
      { title: '月光奏鸣曲 第一乐章', artist: 'Beethoven · 钢琴合成', category: 'piano', coverColor: 2, url: BUILTIN_URLS.pianoMoonlight },
      { title: '夜的钢琴曲五', artist: '石进', category: 'piano', coverColor: 1, duration: 225 },
    ],
  },
  {
    key: 'whitenoise', label: '白噪音', icon: '🌧️', hint: '助眠 · 办公专注',
    default: [
      { title: '窗外雨声（循环）', artist: '本地环境音效', category: 'whitenoise', coverColor: 1, url: BUILTIN_URLS.ambRain, duration: 60 },
      { title: '清晨森林鸟鸣（循环）', artist: '本地环境音效', category: 'whitenoise', coverColor: 2, url: BUILTIN_URLS.ambForest, duration: 60 },
      { title: '咖啡馆环境音（循环）', artist: '本地环境音效', category: 'whitenoise', coverColor: 0, url: BUILTIN_URLS.ambCafe, duration: 60 },
      { title: '海浪声', artist: '环境音', category: 'whitenoise', coverColor: 3, duration: 540 },
      { title: '柴火壁炉声', artist: '环境音', category: 'whitenoise', coverColor: 2, duration: 500 },
      { title: '夏日夜晚虫鸣', artist: '环境音', category: 'whitenoise', coverColor: 0, duration: 60 },
    ],
  },
  {
    key: 'hot', label: '热门歌曲', icon: '🔥', hint: '心情旋律 · 轻松一刻',
    default: [
      { title: '晴天', artist: '周杰伦', category: 'hot', coverColor: 0, duration: 269 },
      { title: '稻香', artist: '周杰伦', category: 'hot', coverColor: 1, duration: 223 },
      { title: '光年之外', artist: '邓紫棋', category: 'hot', coverColor: 2, duration: 235 },
      { title: '起风了', artist: '买辣椒也用券', category: 'hot', coverColor: 3, duration: 326 },
      { title: '海阔天空', artist: 'Beyond', category: 'hot', coverColor: 0, duration: 326 },
      { title: '朋友', artist: '周华健', category: 'hot', coverColor: 1, duration: 256 },
      { title: '月亮代表我的心', artist: '邓丽君', category: 'hot', coverColor: 2, duration: 210 },
    ],
  },
]

// 小程序要求渐变类名带完整 bg-gradient-to-br 前缀
const GRADS = [
  'bg-gradient-to-br from-mint-400 via-emerald-400 to-teal-500',
  'bg-gradient-to-br from-sky-400 via-mint-400 to-emerald-400',
  'bg-gradient-to-br from-amber-300 via-rose-300 to-pink-400',
  'bg-gradient-to-br from-violet-400 via-indigo-400 to-mint-400',
]

const STORAGE_KEY = 'mint.music.v1'

function fmt(sec?: number) {
  if (!sec || !isFinite(sec)) return '00:00'
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36).slice(-4) }

// 构造一份完整默认曲目（新 id）
function buildDefaultTracks(): Track[] {
  const seeded: Track[] = []
  CATS.forEach(c => c.default.forEach(t => seeded.push({ ...t, id: uid(), favorite: false, addedAt: Date.now() })))
  return seeded
}

/**
 * showModal 包装：Taro 4.2 类型尚未包含微信的 editable / placeholderText / content，
 * 运行时能力正常，这里在本地补齐类型（等价于 wx.showModal 的 editable 输入弹窗）。
 */
interface EditableModalResult extends Taro.showModal.SuccessCallbackResult {
  content?: string
}
interface EditableModalOption {
  title?: string
  content?: string
  editable?: boolean
  placeholderText?: string
  confirmText?: string
  confirmColor?: string
  cancelText?: string
  cancelColor?: string
  showCancel?: boolean
  success?: (result: EditableModalResult) => void
  fail?: (res: { errMsg: string }) => void
}
function showEditableModal(option: EditableModalOption) {
  return Taro.showModal(option as Taro.showModal.Option)
}

const Music: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = storage.get<Track[] | null>(STORAGE_KEY, null)
    const seeded = buildDefaultTracks()
    if (!saved || saved.length === 0) return seeded
    // 老存储合并：按 title 比对，把默认数据里缺失的新曲目补入
    const existTitles = new Set(saved.map(x => x.title))
    const missing = seeded.filter(x => !existTitles.has(x.title))
    return missing.length > 0 ? [...saved, ...missing] : saved
  })
  const [cat, setCat] = useState<Track['category']>('piano')
  const [keyword, setKeyword] = useState('')
  const [favOnly, setFavOnly] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(tracks[0]?.id ?? null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [curTime, setCurTime] = useState(0)
  const [durTime, setDurTime] = useState(0)
  const [loadErr, setLoadErr] = useState('')
  const [loadingSrc, setLoadingSrc] = useState(false)

  const audioRef = useRef<Taro.InnerAudioContext | null>(null)

  // 列表过滤
  const visible = useMemo(() => {
    let list = tracks.filter(t => t.category === cat)
    if (favOnly) list = list.filter(t => t.favorite)
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase()
      list = list.filter(t => t.title.toLowerCase().includes(k) || t.artist.toLowerCase().includes(k))
    }
    return list
  }, [tracks, cat, favOnly, keyword])

  // 当前曲目：优先 currentId，兜底取过滤列表 / 全量首项
  const currentTrack = useMemo(
    () => tracks.find(t => t.id === currentId) ?? visible[0] ?? tracks[0] ?? null,
    [tracks, currentId, visible],
  )

  // 给只初始化一次的音频回调读取最新列表与当前曲目
  const playCtxRef = useRef<{ list: Track[]; cid: string | null }>({ list: visible, cid: currentId })
  playCtxRef.current = { list: visible, cid: currentId }

  // 持久化
  useEffect(() => { storage.set(STORAGE_KEY, tracks) }, [tracks])

  // 初始化音频上下文（InnerAudioContext，只创建一次）
  useEffect(() => {
    try {
      const audio = Taro.createInnerAudioContext()
      audioRef.current = audio
      audio.obeyMuteSwitch = false
      audio.autoplay = false

      audio.onCanplay(() => {
        setLoadingSrc(false)
        setDurTime(audio.duration || 0)
      })
      audio.onTimeUpdate(() => {
        setCurTime(audio.currentTime || 0)
        setDurTime(audio.duration || audio.currentTime || 0)
      })
      audio.onEnded(() => {
        setIsPlaying(false)
        // 在当前过滤列表内自动播放下一首
        const { list, cid } = playCtxRef.current
        const idx = list.findIndex(t => t.id === cid)
        if (idx >= 0 && idx < list.length - 1) {
          playTrack(list[idx + 1])
        } else {
          setCurTime(0)
        }
      })
      audio.onError((err) => {
        console.warn('[Music] audio error', err)
        setLoadingSrc(false)
        setLoadErr('音频加载失败，请检查网络或音频合法域名配置')
        setIsPlaying(false)
      })
      audio.onPause(() => setIsPlaying(false))
      audio.onPlay(() => setIsPlaying(true))
    } catch (e) {
      console.warn('[Music] createInnerAudioContext failed', e)
      setLoadErr('当前微信版本不支持音频播放，请升级微信')
    }

    return () => {
      try { audioRef.current?.stop() } catch (e) { /* ignore */ }
      try { audioRef.current?.destroy() } catch (e) { /* ignore */ }
      audioRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 无 URL 曲目：本地模拟进度（与网页版行为一致）
  useEffect(() => {
    if (!currentTrack || !isPlaying || currentTrack.url) return
    const i = setInterval(() => {
      setCurTime((s) => {
        const dur = currentTrack.duration ?? 180
        if (s + 1 >= dur) { setIsPlaying(false); return dur }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(i)
  }, [currentTrack, isPlaying])

  function playTrack(track: Track) {
    if (!track) return
    setLoadErr('')
    setCurrentId(track.id)
    setCurTime(0)
    setDurTime(0)

    // 无音频源：仅切换选中，不报错（通栏展示引导卡片）
    if (!track.url) {
      setIsPlaying(false)
      return
    }

    const audio = audioRef.current
    if (!audio) {
      setLoadErr('音频上下文未就绪')
      return
    }

    try {
      setLoadingSrc(true)
      audio.stop()
      audio.src = track.url
      audio.loop = track.category === 'whitenoise'
      audio.play()
      setIsPlaying(true)
    } catch (e) {
      console.warn('[Music] play failed', e)
      setLoadErr('播放失败：' + (e as Error).message)
      setLoadingSrc(false)
      setIsPlaying(false)
    }
  }

  function togglePlay() {
    if (!currentTrack) return
    // 无 URL：本地模拟播放/暂停
    if (!currentTrack.url) {
      setIsPlaying(p => !p)
      return
    }
    const audio = audioRef.current
    if (!audio) return
    setLoadErr('')
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  function nextPrev(dir: 1 | -1) {
    if (visible.length === 0) return
    const idx = visible.findIndex(t => t.id === currentId)
    let nextIdx = idx + dir
    if (nextIdx < 0) nextIdx = visible.length - 1
    if (nextIdx >= visible.length) nextIdx = 0
    playTrack(visible[nextIdx])
  }

  function seek(value: number) {
    setCurTime(value)
    const audio = audioRef.current
    if (audio && currentTrack?.url) {
      try { audio.seek(value) } catch (e) { /* ignore */ }
    }
  }

  function toggleFav(id: string) {
    setTracks((arr) => arr.map(t => t.id === id ? { ...t, favorite: !t.favorite } : t))
  }

  // 新增曲目：歌名 → 艺术家 → URL（均可分步填写/留空）
  function addTrackFlow() {
    showEditableModal({
      title: '新增曲目',
      editable: true,
      placeholderText: '歌曲名？',
      confirmColor: '#1a9464',
      success: (r1) => {
        if (!r1.confirm) return
        const title = (r1.content || '').trim()
        if (!title) {
          Taro.showToast({ title: '歌名不能为空', icon: 'none' })
          return
        }
        showEditableModal({
          title: '艺术家 / 来源',
          editable: true,
          placeholderText: '可留空',
          confirmColor: '#1a9464',
          success: (r2) => {
            if (!r2.confirm) return
            const artist = (r2.content || '').trim() || '未知'
            showEditableModal({
              title: '音频 URL',
              editable: true,
              placeholderText: '可留空，后续填入',
              confirmColor: '#1a9464',
              success: (r3) => {
                if (!r3.confirm) return
                const url = (r3.content || '').trim()
                setTracks((arr) => [
                  {
                    id: uid(), title, artist, category: cat,
                    coverColor: Math.floor(Math.random() * 4),
                    url: url || undefined,
                    duration: 0, favorite: false, addedAt: Date.now(),
                  },
                  ...arr,
                ])
                Taro.showToast({ title: '已添加', icon: 'success' })
              },
            })
          },
        })
      },
    })
  }

  // 更多菜单：showActionSheet 浮层 + showModal(editable) 输入 + showModal 删除确认
  function openMoreMenu(track: Track) {
    Taro.showActionSheet({
      itemList: ['粘贴音频URL', '编辑信息', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) showSetUrl(track)
        else if (res.tapIndex === 1) showEditTitle(track)
        else if (res.tapIndex === 2) showDelete(track)
      },
    })
  }

  function showSetUrl(track: Track) {
    showEditableModal({
      title: '粘贴音频URL',
      editable: true,
      content: track.url || '',
      placeholderText: 'mp3 / wav 直链',
      confirmColor: '#1a9464',
      success: (r) => {
        if (!r.confirm) return
        const url = (r.content || '').trim()
        setTracks((arr) => arr.map(x => x.id === track.id ? { ...x, url: url || undefined } : x))
        Taro.showToast({ title: url ? 'URL 已更新' : 'URL 已清除', icon: 'success' })
      },
    })
  }

  function showEditTitle(track: Track) {
    showEditableModal({
      title: '修改歌名',
      editable: true,
      content: track.title,
      placeholderText: '歌曲名',
      confirmColor: '#1a9464',
      success: (r) => {
        if (!r.confirm) return
        const title = (r.content || '').trim()
        if (!title) {
          Taro.showToast({ title: '歌名不能为空', icon: 'none' })
          return
        }
        setTracks((arr) => arr.map(x => x.id === track.id ? { ...x, title } : x))
      },
    })
  }

  function showDelete(track: Track) {
    showEditableModal({
      title: '删除曲目',
      content: `确定删除《${track.title}》？`,
      confirmText: '删除',
      confirmColor: '#e5484d',
      success: (r) => {
        if (!r.confirm) return
        setTracks((arr) => arr.filter(x => x.id !== track.id))
        Taro.showToast({ title: '已删除', icon: 'success' })
      },
    })
  }

  const duration = durTime > 0 ? durTime : (currentTrack?.duration || 0)
  const sliderMax = Math.max(1, Math.floor(duration))
  const sliderVal = Math.min(Math.floor(curTime), sliderMax)
  const grad = currentTrack
    ? GRADS[(currentTrack.coverColor ?? 0) % GRADS.length]
    : GRADS[0]
  const catIcon = CATS.find(c => c.key === cat)?.icon ?? '🎵'

  return (
    <View className="animate-fade-up pt-4 pb-8 px-4 flex flex-col gap-4">
      {/* ===== 渐变通栏播放器 ===== */}
      <View className={`relative rounded-3xl overflow-hidden p-5 text-white shadow-soft ${grad}`}>
        {/* 装饰光斑 */}
        <View className="music-blob pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/20" />
        <View className="music-blob pointer-events-none absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-white/10" />

        <View className="relative flex items-center gap-4">
          {/* 左侧半透明图标块 */}
          <View
            className={`shrink-0 w-20 h-20 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center ${isPlaying ? 'animate-pulse' : ''}`}
          >
            <Text className="text-4xl">{catIcon}</Text>
          </View>
          {/* 右侧标题信息 */}
          <View className="flex-1 min-w-0">
            <Text className="block text-[11px] tracking-widest opacity-80">
              {isPlaying ? '正在播放' : '待播放'}
            </Text>
            <Text className="block mt-1 text-xl font-bold line-clamp-1">
              {currentTrack?.title ?? '还没有曲目，先添加一首吧'}
            </Text>
            <Text className="block mt-1 text-sm opacity-90 line-clamp-1">
              {currentTrack?.artist ?? ''}
            </Text>
          </View>
        </View>

        {/* 进度条（Slider 支持拖动 seek） */}
        <View className="relative mt-4">
          <Slider
            min={0}
            max={sliderMax}
            step={1}
            value={sliderVal}
            activeColor="#ffffff"
            backgroundColor="rgba(255,255,255,0.25)"
            blockColor="#ffffff"
            blockSize={14}
            onChanging={(e) => setCurTime(e.detail.value)}
            onChange={(e) => seek(e.detail.value)}
          />
          <View className="mt-1 flex items-center justify-between">
            <Text className="text-[11px] opacity-90">{fmt(curTime)}</Text>
            <Text className="text-[11px] opacity-90">{fmt(duration)}</Text>
          </View>
        </View>

        {/* 控制按钮 */}
        <View className="mt-2 flex items-center justify-center gap-4">
          <View
            hoverClass="ctrl-btn-hover"
            hoverStayTime={80}
            onClick={() => nextPrev(-1)}
            className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center"
          >
            <Text className="text-xl">⏮</Text>
          </View>
          <View
            hoverClass="main-btn-hover"
            hoverStayTime={80}
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center"
          >
            {loadingSrc ? (
              <Text className="text-xs font-bold text-mint-600">加载中</Text>
            ) : (
              <Text className={`text-2xl text-mint-700 ${isPlaying ? '' : 'ml-0.5'}`}>
                {isPlaying ? '⏸' : '▶'}
              </Text>
            )}
          </View>
          <View
            hoverClass="ctrl-btn-hover"
            hoverStayTime={80}
            onClick={() => nextPrev(1)}
            className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center"
          >
            <Text className="text-xl">⏭</Text>
          </View>
        </View>

        {/* 错误 / 无源引导：半透明白底卡片 */}
        {loadErr !== '' ? (
          <View className="relative mt-4 rounded-xl bg-white/20 border border-white/30 px-3 py-2">
            <Text className="text-xs text-white">⚠️ {loadErr}</Text>
          </View>
        ) : currentTrack && !currentTrack.url ? (
          <View className="relative mt-4 rounded-xl bg-white/15 border border-white/20 px-3 py-2">
            <Text className="text-xs text-white">
              💡 当前曲目暂未配置音频源，点曲目右侧「⋯」→「粘贴音频URL」添加 mp3 / wav 直链即可播放。
            </Text>
          </View>
        ) : null}
      </View>

      {/* ===== 3 个大分类卡片 ===== */}
      <View className="grid grid-cols-3 gap-2">
        {CATS.map((c) => {
          const active = c.key === cat
          const count = tracks.filter(t => t.category === c.key).length
          return (
            <View
              key={c.key}
              hoverClass="view-press"
              hoverStayTime={80}
              onClick={() => setCat(c.key)}
              className={`rounded-2xl p-3 border ${active
                ? 'bg-mint-600 border-mint-600 text-white shadow-soft'
                : 'bg-white/80 border-mint-100 text-mint-900 shadow-card'}`}
            >
              <Text className="block text-2xl">{c.icon}</Text>
              <Text className="block mt-1 font-semibold text-sm">{c.label}</Text>
              <Text className={`block mt-0.5 text-[11px] line-clamp-1 ${active ? 'text-white/80' : 'text-mint-700/60'}`}>
                {c.hint}
              </Text>
              <Text className={`block mt-2 text-[11px] ${active ? 'text-white/90' : 'text-mint-700/70'}`}>
                {count} 首
              </Text>
            </View>
          )
        })}
      </View>

      {/* ===== 搜索行 ===== */}
      <View className="flex items-center gap-2">
        <View className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 border border-mint-100 shadow-card">
          <Text className="text-mint-500 text-sm">🔍</Text>
          <Input
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            placeholder="搜歌名或歌手"
            placeholderClass="text-mint-700/40"
            className="flex-1 text-sm"
          />
          {keyword && (
            <View hoverClass="view-press" hoverStayTime={80} onClick={() => setKeyword('')}>
              <Text className="text-mint-400 text-xs">✕</Text>
            </View>
          )}
        </View>
        <View
          hoverClass="view-press"
          hoverStayTime={80}
          onClick={() => setFavOnly(v => !v)}
          className={`px-3 py-2 rounded-xl border ${favOnly
            ? 'bg-amber-500 border-amber-500'
            : 'bg-white/80 border-mint-100 shadow-card'}`}
        >
          <Text className={`text-sm ${favOnly ? 'text-white' : 'text-mint-700'}`}>⭐ 收藏</Text>
        </View>
        <View
          hoverClass="view-press"
          hoverStayTime={80}
          onClick={addTrackFlow}
          className="px-3 py-2 rounded-xl bg-mint-600 shadow-soft"
        >
          <Text className="text-white text-sm">+ 新增</Text>
        </View>
      </View>

      {/* ===== 曲目列表（合并在一个白色大卡片内，行间分隔） ===== */}
      <View className="rounded-2xl overflow-hidden bg-white/85 border border-mint-100 shadow-card">
        {visible.length === 0 ? (
          <View className="py-16 flex flex-col items-center">
            <Text className="text-4xl mb-2">🎵</Text>
            <Text className="text-mint-700/60 text-sm">
              {keyword ? '暂无匹配的曲目' : favOnly ? '还没有收藏的曲目' : '暂无曲目，点「+ 新增」添加吧'}
            </Text>
          </View>
        ) : (
          visible.map((tk, idx) => {
            const active = tk.id === currentTrack?.id
            const g = GRADS[(tk.coverColor ?? 0) % GRADS.length]
            return (
              <View
                key={tk.id}
                className={`flex items-center gap-3 px-3 py-2.5 ${idx > 0 ? 'border-t border-mint-50' : ''} ${active ? 'bg-mint-50' : ''}`}
              >
                {/* 渐变小方块播放键 */}
                <View
                  hoverClass="view-press"
                  hoverStayTime={80}
                  onClick={() => playTrack(tk)}
                  className={`shrink-0 w-11 h-11 rounded-xl ${g} flex items-center justify-center shadow-card`}
                >
                  <Text className={`text-lg text-white ${active && isPlaying ? '' : 'ml-0.5'}`}>
                    {active && isPlaying ? '⏸' : '▶'}
                  </Text>
                </View>
                {/* 曲目信息 */}
                <View
                  className="flex-1 min-w-0"
                  hoverClass="view-press"
                  hoverStayTime={80}
                  onClick={() => playTrack(tk)}
                >
                  <Text className={`block text-sm line-clamp-1 ${active ? 'text-mint-700 font-semibold' : 'text-mint-900'}`}>
                    {tk.title}
                  </Text>
                  <View className="mt-0.5 flex items-center gap-1">
                    <Text className="shrink text-[11px] text-mint-700/60 line-clamp-1">
                      {tk.artist} · {fmt(tk.duration || 0)}
                    </Text>
                    {tk.url ? (
                      <Text className="shrink-0 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-semibold">
                        本地内置
                      </Text>
                    ) : (
                      <Text className="shrink-0 px-1.5 py-0.5 rounded-full bg-mint-100 text-mint-600 text-[10px">
                        需添加URL
                      </Text>
                    )}
                  </View>
                </View>
                {/* 收藏星 */}
                <View
                  hoverClass="view-press"
                  hoverStayTime={80}
                  onClick={() => toggleFav(tk.id)}
                  className="shrink-0 w-9 h-9 flex items-center justify-center"
                >
                  <Text>{tk.favorite ? '⭐' : '☆'}</Text>
                </View>
                {/* 更多 */}
                <View
                  hoverClass="view-press"
                  hoverStayTime={80}
                  onClick={() => openMoreMenu(tk)}
                  className="shrink-0 w-9 h-9 flex items-center justify-center"
                >
                  <Text className="text-mint-500 text-lg">⋯</Text>
                </View>
              </View>
            )
          })
        )}
      </View>
    </View>
  )
}

export default Music
