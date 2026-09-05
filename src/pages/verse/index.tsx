import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Switch, ScrollView } from '@tarojs/components'
import { TAGS_CN, VERSES } from '@/data/verses'
import { storage } from '@/utils/storage'
import { copyText } from '@/utils/clipboard'
import './index.scss'

const FAV_KEY = 'mint.verse.fav.v1'

type TagFilter = 'all' | 'love' | 'faith' | 'hope' | 'peace' | 'wisdom' | 'strength' | 'grace' | 'comfort' | 'joy'

const TAG_KEYS: TagFilter[] = ['all', 'love', 'faith', 'hope', 'peace', 'wisdom', 'strength', 'grace', 'comfort', 'joy']

const Verse: React.FC = () => {
  const [tag, setTag] = useState<TagFilter>('all')
  const [idx, setIdx] = useState<number>(0)
  const [favs, setFavs] = useState<number[]>(() => storage.get<number[]>(FAV_KEY, []))
  const [showFavOnly, setShowFavOnly] = useState(false)
  const [dualLang, setDualLang] = useState<boolean>(true)

  useEffect(() => { storage.set(FAV_KEY, favs) }, [favs])

  // 初始化 idx
  useEffect(() => {
    if (VERSES.length > 0) {
      setIdx(Math.floor(Math.random() * VERSES.length))
    }
  }, [])

  const pool = useMemo(() => {
    let list = VERSES.slice()
    if (tag !== 'all') list = list.filter(v => v.tag === tag)
    if (showFavOnly) list = list.filter(v => favs.includes(v.id))
    return list
  }, [tag, showFavOnly, favs])

  const verse = pool.length > 0 ? pool[idx % pool.length] : null

  const refresh = () => {
    if (pool.length <= 1) return
    let next = idx
    while (next === idx) {
      next = Math.floor(Math.random() * pool.length)
    }
    setIdx(next)
  }

  const toggleFav = () => {
    if (!verse) return
    setFavs(prev => prev.includes(verse.id) ? prev.filter(id => id !== verse.id) : [...prev, verse.id])
  }

  const goPrev = () => {
    if (pool.length <= 1) return
    setIdx(i => (i - 1 + pool.length) % pool.length)
  }

  const goNext = () => {
    if (pool.length <= 1) return
    setIdx(i => (i + 1) % pool.length)
  }

  return (
    <ScrollView scrollY className="verse-page">
      {/* 标签筛选 */}
      <ScrollView scrollX className="tag-scroll">
        <View className="tag-row">
          {TAG_KEYS.map(key => (
            <View
              key={key}
              hoverClass="view-press"
              hoverStayTime={80}
              onClick={() => { setTag(key); setIdx(0) }}
              className={`tag-pill ${tag === key ? 'tag-pill-active' : 'tag-pill-idle'}`}
            >
              <Text>{TAGS_CN[key]?.icon} {TAGS_CN[key]?.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 主卡片 */}
      {verse ? (
        <View className="verse-card">
          <View className={`verse-banner ${tag === 'all' ? 'banner-all' :
            tag === 'love' ? 'banner-love' :
            tag === 'faith' ? 'banner-faith' :
            tag === 'hope' ? 'banner-hope' :
            tag === 'peace' ? 'banner-peace' :
            tag === 'wisdom' ? 'banner-wisdom' :
            tag === 'strength' ? 'banner-strength' :
            tag === 'grace' ? 'banner-grace' :
            tag === 'comfort' ? 'banner-comfort' :
            'banner-joy'}`} />

          <View className="verse-body">
            <View className="verse-meta">
              <Text className="meta-tag">{verse.tag ? TAGS_CN[verse.tag]?.icon + ' ' + TAGS_CN[verse.tag]?.label : '✨'}</Text>
              <View hoverClass="view-press" hoverStayTime={80} onClick={toggleFav} className="fav-btn">
                <Text className={`fav-icon ${favs.includes(verse.id) ? 'fav-on' : 'fav-off'}`}>
                  {favs.includes(verse.id) ? '❤️' : '🤍'}
                </Text>
                <Text className="fav-text">{favs.includes(verse.id) ? '已收藏' : '收藏'}</Text>
              </View>
            </View>

            <View className="verse-zh">
              <Text className="verse-ref">{verse.ref}</Text>
              <Text className="verse-text">{verse.zh}</Text>
            </View>

            {dualLang && (
              <View className="verse-en">
                <Text className="verse-ref">{verse.refEn}</Text>
                <Text className="verse-text-en">{verse.en}</Text>
              </View>
            )}

            <View className="verse-switch">
              <Switch
                checked={dualLang}
                onChange={() => setDualLang(v => !v)}
                color="#1a9464"
              />
              <Text className="switch-label">显示英文</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="verse-empty">
          <Text className="empty-text">{showFavOnly ? '还没有收藏任何金句' : '暂无金句'}</Text>
        </View>
      )}

      {/* 控制按钮 */}
      <View className="ctrl-row">
        <View hoverClass="view-press" hoverStayTime={80} onClick={goPrev} className="ctrl-btn">
          <Text className="ctrl-icon">‹</Text>
        </View>
        <View hoverClass="view-press" hoverStayTime={80} onClick={refresh} className="ctrl-btn-main">
          <Text className="ctrl-icon-big">🔄</Text>
        </View>
        <View hoverClass="view-press" hoverStayTime={80} onClick={goNext} className="ctrl-btn">
          <Text className="ctrl-icon">›</Text>
        </View>
      </View>

      {/* 收藏筛选 */}
      <View className="fav-filter-row">
        <View hoverClass="view-press" hoverStayTime={80} onClick={() => setShowFavOnly(v => !v)} className={showFavOnly ? 'fav-filter-on' : 'fav-filter-off'}>
          <Text>❤️ 我的收藏 ({favs.length})</Text>
        </View>
      </View>

      {verse && (
        <View className="action-row">
          <View hoverClass="view-press" hoverStayTime={80} onClick={() => copyText(verse.zh)} className="action-btn-primary">
            <Text>📋 复制金句</Text>
          </View>
          <View hoverClass="view-press" hoverStayTime={80} onClick={() => copyText(`${verse.zh}\n\n——${verse.ref}`)} className="action-btn-secondary">
            <Text>📝 复制带出处</Text>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default Verse
