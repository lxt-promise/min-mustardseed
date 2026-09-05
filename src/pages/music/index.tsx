import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Input, Switch, Slider } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
import { TRACK_URLS } from '@/config/audio'
import './index.scss'

/**
 * 音乐小站 v1（小程序版）
 *  - 三大分类：钢琴曲 / 白噪音 / 热门歌曲
 *  - 基于 Taro.createInnerAudioContext
 *  - 搜索、收藏、播放控制、进度跳转
 *  - 热门歌曲无版权，默认占位（提示用户手动接入）
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

const CATS: { key: Track['category']; label: string; icon: string; hint: string; default: Omit<Track, 'id' | 'addedAt'>[] }[] = [
  {
    key: 'piano', label: '钢琴曲', icon: '🎹', hint: '平静思绪 · 灵感写作',
    default: [
      { title: '卡农 D 大调', artist: 'Pachelbel · 钢琴合成', category: 'piano', coverColor: 0, url: TRACK_URLS.pianoCanon },
      { title: '致爱丽丝', artist: 'Beethoven · 钢琴合成', category: 'piano', coverColor: 1, url: TRACK_URLS.pianoFurElise },
      { title: '月光奏鸣曲 第一乐章', artist: 'Beethoven · 钢琴合成', category: 'piano', coverColor: 2, url: TRACK_URLS.pianoMoonlight },
    ],
  },
  {
    key: 'whitenoise', label: '白噪音', icon: '🌧️', hint: '助眠 · 办公专注',
    default: [
      { title: '窗外雨声（循环）', artist: '本地环境音效', category: 'whitenoise', coverColor: 1, url: TRACK_URLS.ambRain, duration: 60 },
      { title: '清晨森林鸟鸣（循环）', artist: '本地环境音效', category: 'whitenoise', coverColor: 2, url: TRACK_URLS.ambForest, duration: 60 },
      { title: '咖啡馆环境音（循环）', artist: '本地环境音效', category: 'whitenoise', coverColor: 0, url: TRACK_URLS.ambCafe, duration: 60 },
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
    ],
  },
]

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

const Music: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = storage.get<Track[] | null>(STORAGE_KEY, null)
    if (saved && saved.length > 0) return saved
    const seeded: Track[] = []
    CATS.forEach(c => c.default.forEach(t => seeded.push({ ...t, id: uid(), favorite: false, addedAt: Date.now() })))
    return seeded
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

  // 持久化
  useEffect(() => { storage.set(STORAGE_KEY, tracks) }, [tracks])

  // 初始化音频上下文
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
        // 自动播放下一首
        const idx = tracks.findIndex(t => t.id === currentId)
        if (idx >= 0 && idx < tracks.length - 1) {
          playTrack(tracks[idx + 1])
        } else {
          setCurTime(0)
        }
      })
      audio.onError((err) => {
        console.warn('[Music] audio error', err)
        setLoadingSrc(false)
        setLoadErr('音频加载失败，请检查网络或合法域名')
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

  // 切换分类时，如果正在播放的曲目不属于新分类，不自动停止（保持后台播放体验）
  const currentTrack = useMemo(() => tracks.find(t => t.id === currentId), [tracks, currentId])

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

  function playTrack(track: Track) {
    if (!track) return
    setLoadErr('')
    setCurrentId(track.id)

    if (!track.url) {
      setLoadErr('该曲目暂未配置音频源，可点击「+ 添加」粘贴在线 URL 试听')
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
    const audio = audioRef.current
    if (!audio || !currentTrack?.url) {
      if (currentTrack) playTrack(currentTrack)
      return
    }
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  function stop() {
    const audio = audioRef.current
    if (!audio) return
    audio.stop()
    setIsPlaying(false)
    setCurTime(0)
  }

  function nextPrev(dir: 1 | -1) {
    if (visible.length === 0) return
    const idx = visible.findIndex(t => t.id === currentId)
    let nextIdx = idx + dir
    if (nextIdx < 0) nextIdx = visible.length - 1
    if (nextIdx >= visible.length) nextIdx = 0
    playTrack(visible[nextIdx])
  }

  function toggleFav(id: string) {
    setTracks((arr) => arr.map(t => t.id === id ? { ...t, favorite: !t.favorite } : t))
  }

  function addCustomUrl() {
    Taro.showModal({
      title: '添加在线音频',
      editable: true,
      placeholderText: '粘贴音频 URL (mp3/wav)',
      confirmColor: '#1a9464',
      success: (res) => {
        if (!res.confirm) return
        const url = (res.content || '').trim()
        if (!url) return
        const title = url.split('/').pop()?.split('?')[0] || '自定义音频'
        setTracks((arr) => [
          { id: uid(), title, artist: '在线链接', category: cat, coverColor: 3, url, addedAt: Date.now(), favorite: false },
          ...arr,
        ])
        Taro.showToast({ title: '已添加', icon: 'success' })
      },
    })
  }

  function seek(value: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.seek(value)
    setCurTime(value)
  }

  const progress = durTime > 0 ? curTime / durTime : 0

  return (
    <View className="animate-fade-up pt-4 pb-8 px-4 flex flex-col gap-4">
      {/* 顶部播放器 */}
      {currentTrack && (
        <View className="rounded-3xl bg-white/80 border border-mint-100 shadow-card overflow-hidden">
          {/* 大封面 */}
          <View className={`relative h-44 ${GRADS[currentTrack.coverColor ?? 0]} flex items-center justify-center`}>
            <View className="absolute inset-0 opacity-20">
              <View className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/40" />
              <View className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/30" />
            </View>
            <View className={`relative w-28 h-28 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center ${isPlaying ? 'animate-pop' : ''}`}>
              <View className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-soft">
                <Text className="text-4xl">
                  {currentTrack.category === 'piano' ? '🎹' : currentTrack.category === 'whitenoise' ? '🌧️' : '🎵'}
                </Text>
              </View>
            </View>
            <View className="absolute top-3 left-3">
              <View className="px-2.5 py-1 rounded-full bg-white/30 backdrop-blur-sm">
                <Text className="text-[11px] text-white font-medium">
                  {CATS.find(c => c.key === currentTrack.category)?.label}
                </Text>
              </View>
            </View>
            {currentTrack.favorite && (
              <View className="absolute top-3 right-3">
                <View className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <Text className="text-base">⭐</Text>
                </View>
              </View>
            )}
          </View>

          {/* 歌曲信息 */}
          <View className="p-4">
            <Text className="block text-lg font-bold text-mint-900 line-clamp-1">{currentTrack.title}</Text>
            <Text className="block text-xs text-mint-700/70 mt-0.5">{currentTrack.artist}</Text>

            {/* 进度条 */}
            <View className="mt-3">
              <View className="relative h-1.5 rounded-full bg-mint-100 overflow-hidden">
                <View
                  className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-mint-400 to-mint-600"
                  style={{ width: `${progress * 100}%` }}
                />
                <View
                  className="absolute top-1/2 w-4 h-4 rounded-full bg-white border-2 border-mint-500 shadow"
                  style={{ left: `calc(${progress * 100}% - 8px)`, transform: 'translateY(-50%)' }}
                />
              </View>
              <View className="mt-1.5 flex items-center justify-between">
                <Text className="text-[10px] text-mint-700/70">{fmt(curTime)}</Text>
                <Text className="text-[10px] text-mint-700/70">{fmt(durTime || currentTrack.duration)}</Text>
              </View>
            </View>

            {/* 控制按钮 */}
            <View className="mt-3 flex items-center justify-center gap-6">
              <View hoverClass="view-press" hoverStayTime="80" onClick={() => nextPrev(-1)}>
                <Text className="text-3xl text-mint-700">⏮</Text>
              </View>
              <View
                hoverClass="view-press"
                hoverStayTime="80"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-mint-500 to-mint-700 shadow-soft flex items-center justify-center"
              >
                <Text className="text-3xl text-white">
                  {loadingSrc ? '⏳' : isPlaying ? '⏸' : '▶'}
                </Text>
              </View>
              <View hoverClass="view-press" hoverStayTime="80" onClick={() => nextPrev(1)}>
                <Text className="text-3xl text-mint-700">⏭</Text>
              </View>
              <View hoverClass="view-press" hoverStayTime="80" onClick={stop}>
                <Text className="text-2xl text-mint-700">⏹</Text>
              </View>
            </View>

            {loadErr !== '' && (
              <View className="mt-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                <Text className="text-xs text-amber-700">⚠️ {loadErr}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 分类切换 */}
      <View className="rounded-2xl p-1 grid grid-cols-3 bg-mint-100 border border-mint-100 shadow-card">
        {CATS.map((c) => {
          const active = cat === c.key
          const count = tracks.filter(t => t.category === c.key).length
          return (
            <View
              key={c.key}
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={() => setCat(c.key)}
              className={`rounded-xl py-2 flex flex-col items-center ${active ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className="text-base">{c.icon}</Text>
              <Text className={`text-xs mt-0.5 font-semibold ${active ? 'text-mint-800' : 'text-mint-700/70'}`}>
                {c.label} · {count}
              </Text>
            </View>
          )
        })}
      </View>

      {/* 搜索 & 收藏过滤 */}
      <View className="flex items-center gap-2">
        <View className="flex-1 rounded-2xl bg-white/80 border border-mint-100 shadow-card px-3 py-2 flex items-center gap-2">
          <Text className="text-mint-500">🔍</Text>
          <Input
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            placeholder="搜索歌名或歌手"
            placeholderClass="text-mint-700/40"
            className="flex-1 text-sm"
          />
          {keyword && (
            <View hoverClass="view-press" hoverStayTime="80" onClick={() => setKeyword('')}>
              <Text className="text-mint-400 text-xs">✕</Text>
            </View>
          )}
        </View>
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          onClick={() => setFavOnly(!favOnly)}
          className={`px-3 py-2 rounded-2xl border shadow-card ${favOnly ? 'bg-amber-100 border-amber-300' : 'bg-white/80 border-mint-100'}`}
        >
          <Text className={`text-sm ${favOnly ? 'text-amber-700' : 'text-mint-700'}`}>⭐</Text>
        </View>
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          onClick={addCustomUrl}
          className="px-3 py-2 rounded-2xl bg-mint-600 shadow-card"
        >
          <Text className="text-white text-sm font-semibold">＋</Text>
        </View>
      </View>

      {/* 当前分类提示 */}
      <View className="rounded-2xl bg-mint-50 border border-mint-100 p-3">
        <Text className="text-xs text-mint-700/80">
          💡 {CATS.find(c => c.key === cat)?.hint}
          {cat === 'hot' && ' · 热门歌曲需手动接入音频源（受版权保护）'}
        </Text>
      </View>

      {/* 列表 */}
      <View className="flex flex-col gap-2">
        {visible.length === 0 ? (
          <View className="rounded-2xl bg-white/70 border border-mint-100 border-dashed py-12 text-center">
            <Text className="text-4xl block mb-2">🎼</Text>
            <Text className="text-mint-700/60 text-sm">
              {keyword ? '没有匹配的曲目' : favOnly ? '还没收藏任何歌曲' : '该分类暂无曲目'}
            </Text>
          </View>
        ) : (
          visible.map((t) => (
            <TrackRow
              key={t.id}
              track={t}
              isCurrent={currentId === t.id}
              isPlaying={isPlaying}
              onPlay={() => playTrack(t)}
              onFav={() => toggleFav(t.id)}
            />
          ))
        )}
      </View>
    </View>
  )
}

const TrackRow: React.FC<{
  track: Track
  isCurrent: boolean
  isPlaying: boolean
  onPlay: () => void
  onFav: () => void
}> = ({ track, isCurrent, isPlaying, onPlay, onFav }) => {
  const hasUrl = !!track.url
  return (
    <View
      className={`rounded-2xl bg-white/90 border shadow-card p-3 flex items-center gap-3 ${isCurrent ? 'border-mint-500 ring-2 ring-mint-200' : 'border-mint-100'}`}
    >
      {/* 封面 + 播放 */}
      <View
        hoverClass="view-press"
        hoverStayTime="80"
        onClick={onPlay}
        className={`shrink-0 w-12 h-12 rounded-xl ${GRADS[track.coverColor ?? 0]} flex items-center justify-center relative overflow-hidden`}
      >
        {!hasUrl && (
          <View className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Text className="text-xs text-white">🔒</Text>
          </View>
        )}
        <Text className={`text-2xl ${!hasUrl ? 'opacity-50' : ''}`}>
          {track.category === 'piano' ? '🎹' : track.category === 'whitenoise' ? '🌧️' : '🎵'}
        </Text>
        {isCurrent && isPlaying && (
          <View className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Text className="text-sm text-white">🔊</Text>
          </View>
        )}
      </View>

      {/* 信息 */}
      <View className="flex-1 min-w-0" hoverClass="view-press" hoverStayTime="80" onClick={onPlay}>
        <Text className={`block text-sm font-semibold line-clamp-1 ${isCurrent ? 'text-mint-700' : 'text-mint-900'}`}>
          {track.title}
        </Text>
        <Text className="block text-[11px] text-mint-700/60 mt-0.5 line-clamp-1">
          {track.artist} {track.duration ? `· ${fmt(track.duration)}` : ''}
        </Text>
      </View>

      {/* 收藏 */}
      <View hoverClass="view-press" hoverStayTime="80" onClick={onFav} className="shrink-0">
        <Text className={`text-lg ${track.favorite ? 'text-amber-400' : 'text-mint-300'}`}>
          {track.favorite ? '⭐' : '☆'}
        </Text>
      </View>
    </View>
  )
}

export default Music
