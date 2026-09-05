import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Input, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
import { copyText } from '@/utils/clipboard'
import './index.scss'

/**
 * 待办清单 v1（小程序版）
 *  - 增删改查、完成/未完成、星标
 *  - 截止日期（今天/明天/下周/清除）
 *  - 多维筛选（全部/今天/待办/星标/已完成）
 *  - 一键导出文本
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
  '复盘昨天的待办',
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
  const [showSuggestions, setShowSuggestions] = useState(false)

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

  function addTodo(text?: string) {
    const v = (text ?? input).trim()
    if (!v) return
    setTodos((arr) => [{ id: uid(), text: v, done: false, createdAt: Date.now() }, ...arr])
    setInput('')
    setShowSuggestions(false)
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
  function startEdit(t: TodoItem) { setEditingId(t.id); setEditText(t.text) }
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
      {/* 进度卡片 */}
      <View className="rounded-2xl p-5 bg-white/80 border border-mint-100 shadow-card">
        <View className="flex items-end justify-between mb-3">
          <View>
            <Text className="text-xs text-mint-700/70">今日进度</Text>
            <View className="mt-1 flex items-baseline gap-2">
              <Text className="text-3xl font-bold text-mint-900">{stats.todayDone}</Text>
              <Text className="text-sm text-mint-700/60">/ {stats.today} 完成</Text>
            </View>
          </View>
          <View className="text-right">
            <Text className="text-2xl font-bold text-mint-600">{progress}%</Text>
            <Text className="text-[10px] text-mint-700/60">总进度</Text>
          </View>
        </View>
        <View className="w-full h-2 rounded-full bg-mint-50 overflow-hidden">
          <View
            className="h-full rounded-full bg-gradient-to-r from-mint-400 to-mint-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </View>
        <View className="mt-3 flex items-center justify-around text-xs text-mint-700/80">
          <Text>📋 总数 {stats.all}</Text>
          <Text>✅ 完成 {stats.done}</Text>
          <Text>⭐ 星标 {stats.star}</Text>
        </View>
      </View>

      {/* 输入区 */}
      <View className="rounded-2xl bg-white/80 border border-mint-100 shadow-card p-3 flex items-center gap-2">
        <Input
          value={input}
          onInput={(e) => setInput(e.detail.value)}
          onConfirm={() => addTodo()}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="想做什么？按回车添加..."
          placeholderClass="text-mint-700/40"
          confirmType="done"
          className="flex-1 bg-mint-50/50 rounded-xl px-3 py-2 text-sm"
        />
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          onClick={() => addTodo()}
          className="px-4 py-2 rounded-xl bg-mint-600 shadow-soft"
        >
          <Text className="text-white text-sm font-semibold">＋ 添加</Text>
        </View>
      </View>

      {/* 建议词 */}
      {showSuggestions && input === '' && (
        <View className="rounded-2xl bg-mint-50 border border-mint-100 p-3 flex flex-col gap-2 animate-fade-up">
          <Text className="text-xs text-mint-700/70 px-1">💡 不知道写啥？试试这些：</Text>
          <View className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s, i) => (
              <View
                key={i}
                hoverClass="view-press"
                hoverStayTime="80"
                onClick={() => addTodo(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-mint-200"
              >
                <Text className="text-mint-700">{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 筛选 Tab */}
      <View className="flex items-center justify-between gap-1 overflow-x-auto">
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <View
              key={f.key}
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs border ${active ? 'bg-mint-600 border-mint-600 shadow-sm' : 'bg-white/80 border-mint-100'}`}
            >
              <Text className={active ? 'text-white' : 'text-mint-700'}>{f.icon} {f.label}</Text>
            </View>
          )
        })}
      </View>

      {/* 操作栏 */}
      <View className="flex items-center justify-between">
        <Text className="text-xs text-mint-700/60">
          {visible.length > 0 ? `共 ${visible.length} 项` : '列表为空'}
        </Text>
        <View className="flex items-center gap-3">
          <View hoverClass="view-press" hoverStayTime="80" onClick={exportText}>
            <Text className="text-xs text-mint-600 underline">📤 导出</Text>
          </View>
          <View hoverClass="view-press" hoverStayTime="80" onClick={clearDone}>
            <Text className="text-xs text-rose-500 underline">🧹 清理已完成</Text>
          </View>
        </View>
      </View>

      {/* 列表 */}
      <View className="flex flex-col gap-2">
        {visible.length === 0 ? (
          <View className="rounded-2xl bg-white/70 border border-mint-100 border-dashed py-12 text-center">
            <Text className="text-4xl block mb-2">📝</Text>
            <Text className="text-mint-700/60 text-sm">
              {filter === 'all' ? '还没有待办，添加一个吧～' : '这个分类下没有内容'}
            </Text>
          </View>
        ) : (
          visible.map((t) => (
            <TodoRow
              key={t.id}
              item={t}
              editing={editingId === t.id}
              editText={editText}
              setEditText={setEditText}
              onToggle={() => toggle(t.id)}
              onStar={() => toggleStar(t.id)}
              onDelete={() => remove(t.id)}
              onStartEdit={() => startEdit(t)}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditingId(null)}
              onSetDue={(offset) => setDue(t.id, offset)}
            />
          ))
        )}
      </View>
    </View>
  )
}

const TodoRow: React.FC<{
  item: TodoItem
  editing: boolean
  editText: string
  setEditText: (v: string) => void
  onToggle: () => void
  onStar: () => void
  onDelete: () => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onSetDue: (offset: number | null) => void
}> = ({ item, editing, editText, setEditText, onToggle, onStar, onDelete, onStartEdit, onSaveEdit, onCancelEdit, onSetDue }) => {
  const overdue = isOverdue(item)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <View
      className={`rounded-2xl bg-white border shadow-card overflow-hidden ${item.done ? 'border-mint-50 opacity-75' : overdue ? 'border-rose-200' : 'border-mint-100'}`}
    >
      <View className="flex items-start gap-3 p-3">
        {/* 完成勾选 */}
        <View
          hoverClass="view-press"
          hoverStayTime="80"
          onClick={onToggle}
          className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.done ? 'bg-mint-500 border-mint-500' : 'border-mint-300 bg-white'}`}
        >
          {item.done && <Text className="text-white text-xs leading-none">✓</Text>}
        </View>

        {/* 内容 */}
        <View className="flex-1 min-w-0">
          {editing ? (
            <View className="flex items-center gap-1.5">
              <Input
                value={editText}
                onInput={(e) => setEditText(e.detail.value)}
                onConfirm={onSaveEdit}
                focus
                className="flex-1 bg-mint-50/50 rounded-lg px-2 py-1 text-sm border border-mint-200"
              />
              <View
                hoverClass="view-press"
                hoverStayTime="80"
                onClick={onSaveEdit}
                className="px-2 py-1 rounded-lg bg-mint-600"
              >
                <Text className="text-white text-xs">✓</Text>
              </View>
              <View
                hoverClass="view-press"
                hoverStayTime="80"
                onClick={onCancelEdit}
                className="px-2 py-1 rounded-lg bg-mint-50"
              >
                <Text className="text-mint-600 text-xs">✕</Text>
              </View>
            </View>
          ) : (
            <View hoverClass="view-press" hoverStayTime="80" onClick={onStartEdit}>
              <Text className={`text-sm leading-relaxed break-all ${item.done ? 'line-through text-mint-700/50' : 'text-mint-900'}`}>
                {item.text}
              </Text>
              {(item.dueAt || item.star) && (
                <View className="mt-1 flex items-center gap-2 flex-wrap">
                  {item.dueAt && (
                    <Text className={`text-[10px] px-2 py-0.5 rounded-full ${overdue ? 'bg-rose-100 text-rose-600' : 'bg-mint-50 text-mint-700'}`}>
                      📅 {fmtDate(item.dueAt)}
                      {overdue && ' · 已过期'}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* 右侧操作 */}
        <View className="flex flex-col items-center gap-1.5 shrink-0">
          <View hoverClass="view-press" hoverStayTime="80" onClick={onStar}>
            <Text className={`text-base ${item.star ? 'text-amber-400' : 'text-mint-300'}`}>
              {item.star ? '⭐' : '☆'}
            </Text>
          </View>
          <View hoverClass="view-press" hoverStayTime="80" onClick={() => setMenuOpen(!menuOpen)}>
            <Text className="text-mint-400 text-sm">⋯</Text>
          </View>
        </View>
      </View>

      {/* 操作菜单 */}
      {menuOpen && (
        <View className="border-t border-mint-50 bg-mint-50/50 p-2 animate-fade-up">
          <View className="flex flex-wrap gap-1.5">
            <View
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={() => { onSetDue(0); setMenuOpen(false) }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-mint-200"
            >
              <Text className="text-mint-700">📅 今天</Text>
            </View>
            <View
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={() => { onSetDue(1); setMenuOpen(false) }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-mint-200"
            >
              <Text className="text-mint-700">📅 明天</Text>
            </View>
            <View
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={() => { onSetDue(7); setMenuOpen(false) }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-mint-200"
            >
              <Text className="text-mint-700">📅 下周</Text>
            </View>
            {item.dueAt && (
              <View
                hoverClass="view-press"
                hoverStayTime="80"
                onClick={() => { onSetDue(null); setMenuOpen(false) }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-mint-200"
              >
                <Text className="text-mint-700">🚫 清除日期</Text>
              </View>
            )}
            <View
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={onDelete}
              className="text-[11px] px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200"
            >
              <Text className="text-rose-600">🗑️ 删除</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default Todo
