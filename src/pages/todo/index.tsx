import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
import { copyText } from '@/utils/clipboard'
import './index.scss'

/**
 * 待办清单 v1（小程序版）
 *  - 增删改查、完成/未完成、星标
 *  - 截止日期（今天/明天/下周/清除）
 *  - 多维筛选（全部/今天/待办/星标/已完成）
 *  - 一键导出文本到剪贴板
 */

export interface TodoItem {
  id: string
  text: string
  done: boolean
  star?: boolean
  createdAt: number
  dueAt?: number
}

const STORAGE_KEY = 'mint.todo.v1'
type Filter = 'all' | 'today' | 'todo' | 'done' | 'star'

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: 'all',   label: '全部',   icon: '📋' },
  { key: 'today', label: '今天',   icon: '🌿' },
  { key: 'todo',  label: '待办',   icon: '⏳' },
  { key: 'star',  label: '星标',   icon: '⭐' },
  { key: 'done',  label: '已完成', icon: '✅' },
]

const SUGGESTIONS = [
  '整理今天的会议纪要',
  '喝水 2L 💧',
  '下午散步 15 分钟',
  '回复未读邮件',
  '读书 20 分钟',
  'Review 昨天的待办',
]

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36).slice(-4)
}
function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() }
function endOfToday() { return startOfToday() + 86400000 - 1 }
function fmtDate(ts?: number): string {
  if (!ts) return ''
  const today = startOfToday()
  if (ts >= today && ts <= today + 86400000 - 1) return '今天'
  const t = today + 86400000
  if (ts >= t && ts <= t + 86400000 - 1) return '明天'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
function isOverdue(t: TodoItem): boolean {
  if (t.done || !t.dueAt) return false
  return t.dueAt < Date.now()
}

const Todo: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>(() => storage.get<TodoItem[]>(STORAGE_KEY, []))
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null)

  useEffect(() => { storage.set(STORAGE_KEY, todos) }, [todos])

  const todayStart = startOfToday()
  const todayEnd = endOfToday()

  const stats = useMemo(() => {
    const today = todos.filter(t =>
      (t.dueAt && t.dueAt >= todayStart && t.dueAt <= todayEnd) ||
      (!t.dueAt && t.createdAt >= todayStart && t.createdAt <= todayEnd)
    )
    return {
      all: todos.length,
      done: todos.filter(t => t.done).length,
      today: today.length,
      todayDone: today.filter(t => t.done).length,
      star: todos.filter(t => t.star).length,
    }
  }, [todos, todayStart, todayEnd])

  const progress = stats.all === 0 ? 0 : Math.round((stats.done / stats.all) * 100)

  const visible = useMemo(() => {
    let list = todos.slice()
    switch (filter) {
      case 'today':
        list = list.filter(t =>
          (t.dueAt && t.dueAt >= todayStart && t.dueAt <= todayEnd) ||
          (!t.dueAt && t.createdAt >= todayStart && t.createdAt <= todayEnd))
        break
      case 'todo': list = list.filter(t => !t.done); break
      case 'done': list = list.filter(t => t.done); break
      case 'star': list = list.filter(t => t.star); break
    }
    list.sort((a, b) => {
      if (!!a.star !== !!b.star) return (a.star ? 0 : 1) - (b.star ? 0 : 1)
      if (a.done !== b.done) return Number(a.done) - Number(b.done)
      return b.createdAt - a.createdAt
    })
    return list
  }, [todos, filter, todayStart, todayEnd])

  function addTodo() {
    const text = input.trim()
    if (!text) return
    setTodos((arr) => [{ id: uid(), text, done: false, createdAt: Date.now() }, ...arr])
    setInput('')
  }
  function toggle(id: string) { setTodos((arr) => arr.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  function toggleStar(id: string) { setTodos((arr) => arr.map(t => t.id === id ? { ...t, star: !t.star } : t)) }
  function remove(id: string) {
    Taro.showModal({
      title: '删除该待办？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) setTodos((arr) => arr.filter(t => t.id !== id))
      },
    })
  }
  function setDue(id: string, offsetDays: number | null) {
    setTodos((arr) => arr.map(t => {
      if (t.id !== id) return t
      if (offsetDays === null) return { ...t, dueAt: undefined }
      const d = new Date(); d.setHours(23, 59, 59, 999); d.setDate(d.getDate() + offsetDays)
      return { ...t, dueAt: d.getTime() }
    }))
  }
  function startEdit(t: TodoItem) { setEditingId(t.id); setEditText(t.text); setOpenMenuFor(null) }
  function saveEdit() {
    const text = editText.trim()
    if (text && editingId) {
      setTodos((arr) => arr.map(t => t.id === editingId ? { ...t, text } : t))
    }
    setEditingId(null)
  }
  function clearDone() {
    const doneCount = todos.filter(t => t.done).length
    if (doneCount === 0) {
      Taro.showToast({ title: '没有已完成项', icon: 'none' })
      return
    }
    Taro.showModal({
      title: '清除所有已完成？',
      content: `共 ${doneCount} 项已完成，确定清除？`,
      confirmColor: '#1a9464',
      success: (res) => {
        if (res.confirm) setTodos((arr) => arr.filter(t => !t.done))
      },
    })
  }
  function exportText() {
    if (todos.length === 0) {
      Taro.showToast({ title: '暂无待办可导出', icon: 'none' })
      return
    }
    const lines = todos.slice()
      .sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt)
      .map((t, i) => `${i + 1}. [${t.done ? '✓' : ' '}] ${t.star ? '⭐ ' : ''}${t.text}${t.dueAt ? `  ·  ${fmtDate(t.dueAt)}` : ''}`)
      .join('\n')
    const head = `我的芥菜种子待办清单\n导出时间：${new Date().toLocaleString()}\n完成：${stats.done}/${stats.all}\n\n`
    copyText(head + lines, '已复制到剪贴板，可粘贴到备忘录')
  }

  return (
    <View className="animate-fade-up pt-4 pb-8 px-4 flex flex-col gap-4">
      {/* 统计卡片 */}
      <View className="rounded-2xl p-5 bg-white/80 border border-mint-100 shadow-card">
        <View className="flex items-end justify-between">
          <View>
            <Text className="text-xs text-mint-700/70">今日进度</Text>
            <View className="mt-1 flex items-baseline gap-2">
              <Text className="text-3xl font-bold text-mint-900">{stats.todayDone}</Text>
              <Text className="text-sm text-mint-700/60">/ {stats.today} 完成</Text>
            </View>
          </View>
          <View className="text-right text-xs text-mint-700/70 leading-relaxed">
            <Text>总共 {stats.all} 条 · 已完成 {stats.done}</Text>
            <Text className="block">⭐ 星标 {stats.star} 条</Text>
          </View>
        </View>
        <View className="mt-3 h-2 rounded-full bg-mint-100 overflow-hidden">
          <View
            className="h-full bg-gradient-to-r from-mint-500 to-mint-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* 输入卡片 */}
      <View className="rounded-2xl bg-white/90 border border-mint-100 shadow-card p-3">
        <View className="flex items-center gap-2">
          <Input
            value={input}
            onInput={(e) => setInput(e.detail.value)}
            onConfirm={() => addTodo()}
            placeholder="写下今天要做的事… 回车添加"
            placeholderClass="text-mint-700/40"
            confirmType="done"
            className="flex-1 bg-mint-50/50 rounded-xl px-4 py-2.5 text-sm"
          />
          <View
            hoverClass="view-press"
            hoverStayTime={80}
            onClick={() => addTodo()}
            className="px-4 py-2.5 rounded-xl bg-mint-600 shadow-sm"
          >
            <Text className="text-white text-sm font-semibold">添加</Text>
          </View>
        </View>
        <View className="mt-2 flex gap-2 flex-wrap">
          {SUGGESTIONS.map(s => (
            <View
              key={s}
              hoverClass="view-press"
              hoverStayTime={80}
              onClick={() => setInput(s)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-mint-50 border border-mint-100"
            >
              <Text className="text-mint-700">+ {s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 筛选行 */}
      <View className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map(f => {
          const active = filter === f.key
          return (
            <View
              key={f.key}
              hoverClass="view-press"
              hoverStayTime={80}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${active ? 'bg-mint-600 border-mint-600 shadow-sm' : 'bg-white/80 border-mint-100'}`}
            >
              <Text className={active ? 'text-white' : 'text-mint-700'}>{f.icon} {f.label}</Text>
            </View>
          )
        })}
        <View className="flex-1" />
        {stats.done > 0 && (
          <View
            hoverClass="view-press"
            hoverStayTime={80}
            onClick={clearDone}
            className="shrink-0 px-3 py-2 rounded-xl text-xs border border-rose-100 bg-rose-50/40"
          >
            <Text className="text-rose-500">清除已完成</Text>
          </View>
        )}
        <View
          hoverClass="view-press"
          hoverStayTime={80}
          onClick={exportText}
          className="shrink-0 px-3 py-2 rounded-xl text-xs text-mint-700 border border-mint-100 bg-white"
        >
          <Text>导出</Text>
        </View>
      </View>

      {/* 列表 */}
      <View className="flex flex-col gap-2">
        {visible.length === 0 && (
          <View className="py-16 text-center">
            <Text className="text-4xl block mb-3">🌱</Text>
            <Text className="text-mint-700/60 text-sm">
              {filter === 'done' ? '还没有完成的待办，加油！' :
               filter === 'todo' ? '暂时没有待处理的任务' :
               filter === 'today' ? '今天还没有安排，添加一个吧' :
               filter === 'star' ? '星标重要的任务，它们会出现在这里' :
               '空空如也，写点什么？'}
            </Text>
          </View>
        )}
        {visible.map(t => {
          const editing = editingId === t.id
          const overdue = isOverdue(t)
          return (
            <View
              key={t.id}
              className={`rounded-2xl p-3 flex items-start gap-3 bg-white/85 border shadow-card ${t.done ? 'opacity-60 border-mint-50' : 'border-mint-100'}`}
            >
              {/* 完成勾选（方形） */}
              <View
                hoverClass="view-press"
                hoverStayTime={80}
                onClick={() => toggle(t.id)}
                className={`shrink-0 mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center box-border ${t.done ? 'bg-mint-500 border-mint-500' : 'border-mint-300 bg-white'}`}
              >
                {t.done && <Text className="text-white text-xs leading-none">✓</Text>}
              </View>

              {/* 内容 */}
              <View className="flex-1 min-w-0">
                {editing ? (
                  <View className="flex items-center gap-2">
                    <Input
                      value={editText}
                      onInput={(e) => setEditText(e.detail.value)}
                      onConfirm={saveEdit}
                      focus
                      className="flex-1 rounded-lg px-2 py-1 bg-mint-50 border border-mint-200 text-sm"
                    />
                    <View
                      hoverClass="view-press"
                      hoverStayTime={80}
                      onClick={saveEdit}
                      className="px-2 py-1 rounded-lg bg-mint-50"
                    >
                      <Text className="text-xs text-mint-700">保存</Text>
                    </View>
                    <View
                      hoverClass="view-press"
                      hoverStayTime={80}
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1"
                    >
                      <Text className="text-xs text-mint-500">取消</Text>
                    </View>
                  </View>
                ) : (
                  <View hoverClass="view-press" hoverStayTime={80} onClick={() => startEdit(t)}>
                    <Text className={`text-[15px] leading-6 break-words block ${t.done ? 'line-through text-mint-700/60' : 'text-mint-900'}`}>
                      {t.text}
                    </Text>
                  </View>
                )}
                <View className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-mint-700/70">
                  {t.dueAt && (
                    <Text className={`px-2 py-0.5 rounded-full ${overdue ? 'bg-rose-50 text-rose-500' : 'bg-mint-50 text-mint-700'}`}>
                      📅 {fmtDate(t.dueAt)}{overdue && ' · 已到期'}
                    </Text>
                  )}
                  <Text className="opacity-60">{new Date(t.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>

              {/* 右侧操作区 */}
              <View className="flex items-center gap-1 shrink-0 relative">
                <View
                  hoverClass="view-press"
                  hoverStayTime={80}
                  onClick={() => toggleStar(t.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                >
                  <Text className="text-base leading-none">{t.star ? '⭐' : '☆'}</Text>
                </View>
                <View
                  hoverClass="view-press"
                  hoverStayTime={80}
                  onClick={() => setOpenMenuFor(openMenuFor === t.id ? null : t.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                >
                  <Text className="text-base leading-none">📅</Text>
                </View>
                {openMenuFor === t.id && (
                  <>
                    <View
                      className="fixed top-0 left-0 right-0 bottom-0 z-40"
                      onClick={() => setOpenMenuFor(null)}
                    />
                    <View
                      className="absolute right-0 z-50 w-36 rounded-xl bg-white shadow-soft border border-mint-100 box-border"
                      style={{ top: '-224px' }}
                    >
                      <View
                        hoverClass="menu-press"
                        hoverStayTime={80}
                        onClick={() => { setDue(t.id, 0); setOpenMenuFor(null) }}
                        className="h-9 box-border flex items-center px-3 text-sm"
                      >
                        <Text>📅 今天</Text>
                      </View>
                      <View
                        hoverClass="menu-press"
                        hoverStayTime={80}
                        onClick={() => { setDue(t.id, 1); setOpenMenuFor(null) }}
                        className="h-9 box-border flex items-center px-3 text-sm"
                      >
                        <Text>📅 明天</Text>
                      </View>
                      <View
                        hoverClass="menu-press"
                        hoverStayTime={80}
                        onClick={() => { setDue(t.id, 7); setOpenMenuFor(null) }}
                        className="h-9 box-border flex items-center px-3 text-sm"
                      >
                        <Text>📅 下周</Text>
                      </View>
                      <View
                        hoverClass="menu-press"
                        hoverStayTime={80}
                        onClick={() => { setDue(t.id, null); setOpenMenuFor(null) }}
                        className="h-9 box-border flex items-center px-3 text-sm border-t border-mint-50 text-mint-500"
                      >
                        <Text>清除日期</Text>
                      </View>
                      <View
                        hoverClass="menu-press"
                        hoverStayTime={80}
                        onClick={() => startEdit(t)}
                        className="h-9 box-border flex items-center px-3 text-sm border-t border-mint-50"
                      >
                        <Text>✏️ 编辑</Text>
                      </View>
                      <View
                        hoverClass="menu-press-rose"
                        hoverStayTime={80}
                        onClick={() => { setOpenMenuFor(null); remove(t.id) }}
                        className="h-9 box-border flex items-center px-3 text-sm border-t border-mint-50"
                      >
                        <Text className="text-rose-500">🗑️ 删除</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default Todo
