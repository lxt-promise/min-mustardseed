import React, { useMemo, useState } from 'react'
import { View, Text, Picker } from '@tarojs/components'

/**
 * 工作日计算器 v2（小程序版）
 *  - 仅"区间工作日"模式
 *  - 工作模式切换：双休 / 单休 (周日休) / 大小周 (周日+隔周六休)
 *  - 快捷选择：本周 / 本月 / 本季度 / 今年剩余
 *  - 下方日历展开视图：格子分别标记 工作日 / 周末(实际休) / 法定假 / 调休补班
 *  - 内置 2025 / 2026 法定假 + 调休补班表 (简化版，仅供参考)
 */

type WorkMode = 'double' | 'single' | 'bigsmall'
const WM_LABEL: Record<WorkMode, string> = {
  double: '双休', single: '单休', bigsmall: '大小周',
}

const YMD = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const PARSE = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
const TODAY = YMD(new Date())
const addDays = (s: string, n: number) => {
  const d = PARSE(s); d.setDate(d.getDate() + n); return YMD(d)
}
const diffDays = (a: string, b: string) => Math.round((PARSE(b).getTime() - PARSE(a).getTime()) / 86400000)
const plus = (s: string, n: number) => {
  const parts = s.split('-').map(Number)
  const d = new Date(parts[0], (parts[1] ?? 1) - 1, parts[2] ?? 1)
  d.setDate(d.getDate() + n)
  return YMD(d)
}

// 2025 法定休假（简化）
const HOLIDAYS_2025 = [
  '2025-01-01',
  '2025-01-28','2025-01-29','2025-01-30','2025-01-31','2025-02-01','2025-02-02','2025-02-03','2025-02-04',
  '2025-04-04','2025-04-05','2025-04-06',
  '2025-05-01','2025-05-02','2025-05-03','2025-05-04','2025-05-05',
  '2025-05-31','2025-06-01','2025-06-02',
  '2025-10-01','2025-10-02','2025-10-03','2025-10-04','2025-10-05','2025-10-06','2025-10-07','2025-10-08',
]
const WORKDAYS_2025 = ['2025-01-26','2025-02-08','2025-04-27','2025-04-26','2025-09-28','2025-10-11']

// 2026 法定休假（简化预测版）
const HOLIDAYS_2026 = [
  '2026-01-01','2026-01-02','2026-01-03',
  '2026-02-15','2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-02-21','2026-02-22','2026-02-23',
  '2026-04-04','2026-04-05','2026-04-06',
  '2026-05-01','2026-05-02','2026-05-03','2026-05-04','2026-05-05',
  '2026-06-19','2026-06-20','2026-06-21',
  '2026-09-25','2026-09-26','2026-09-27',
  '2026-10-01','2026-10-02','2026-10-03','2026-10-04','2026-10-05','2026-10-06','2026-10-07','2026-10-08',
]
const WORKDAYS_2026 = ['2026-02-14','2026-02-28','2026-04-26','2026-09-20','2026-10-10']

const MONTH_CN = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']

function weekOfMonthIso(d: Date) {
  // ISO 周号 %2，用于大小周（偶数周周六休 / 奇数周大周上班）
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((+t - +yearStart) / 86400000) + 1) / 7)
  return weekNo
}

type CellKind = 'work' | 'weekend' | 'holiday' | 'makeup' | 'off' // off = 非本月

const Workdays: React.FC = () => {
  const today = new Date()

  const [workMode, setWorkMode] = useState<WorkMode>('double')
  const defaults = (() => {
    const t = new Date()
    const wd = (t.getDay() + 6) % 7
    return { start: plus(TODAY, -wd), end: plus(TODAY, 6 - wd) }
  })()
  const [start, setStart] = useState<string>(defaults.start)
  const [end, setEnd] = useState<string>(defaults.end)

  const holidaySet = useMemo(() => new Set([...HOLIDAYS_2025, ...HOLIDAYS_2026]), [])
  const makeupSet  = useMemo(() => new Set([...WORKDAYS_2025, ...WORKDAYS_2026]), [])

  const isRestDayByMode = (ymd: string) => {
    const d = PARSE(ymd)
    const dow = d.getDay()  // 0=Sun
    if (workMode === 'double') return dow === 0 || dow === 6
    if (workMode === 'single') return dow === 0
    if (dow === 0) return true
    if (dow === 6) return weekOfMonthIso(d) % 2 === 0
    return false
  }

  const classifyDay = (ymd: string): CellKind => {
    if (holidaySet.has(ymd)) return 'holiday'
    if (makeupSet.has(ymd)) return 'makeup'
    if (isRestDayByMode(ymd)) return 'weekend'
    return 'work'
  }

  const rangeResult = useMemo(() => {
    if (!start || !end) return null
    let total = diffDays(start, end)
    let neg = false
    if (total < 0) { total = -total; neg = true }
    let work = 0, weekend = 0, hol = 0, makeup = 0
    for (let i = 0; i <= total; i++) {
      const d = addDays(start, neg ? -i : i)
      if (holidaySet.has(d)) hol++
      else if (makeupSet.has(d)) { makeup++; work++ }
      else {
        const rest = isRestDayByMode(d)
        if (rest) weekend++; else work++
      }
    }
    return {
      realStart: neg ? end : start,
      realEnd:   neg ? start : end,
      total: total + 1,
      work, weekend, hol, makeup,
    }
  }, [start, end, workMode]) // eslint-disable-line

  // ====== Presets ======
  const thisWeek = () => {
    const t = new Date(); const wd = (t.getDay() + 6) % 7
    setStart(plus(TODAY, -wd)); setEnd(plus(TODAY, 6 - wd))
  }
  const thisMonth = () => {
    const y = today.getFullYear(), m = today.getMonth()
    setStart(YMD(new Date(y, m, 1)))
    setEnd(YMD(new Date(y, m + 1, 0)))
  }
  const thisQuarter = () => {
    const y = today.getFullYear()
    const q = Math.floor(today.getMonth() / 3)
    const startM = q * 3, endM = q * 3 + 2
    setStart(YMD(new Date(y, startM, 1)))
    setEnd(YMD(new Date(y, endM + 1, 0)))
  }
  const yearRemain = () => {
    setStart(TODAY)
    setEnd(`${today.getFullYear()}-12-31`)
  }

  // ====== Calendar ======
  const months = useMemo(() => buildMonths(rangeResult?.realStart ?? start, rangeResult?.realEnd ?? end),
    [start, end, rangeResult])

  return (
    <View className="animate-fade-up px-4 pt-4 pb-8 flex flex-col gap-5">
      {/* 工作模式 */}
      <View className="rounded-2xl p-1 grid grid-cols-3 bg-mint-100 border border-mint-100 shadow-card">
        {(Object.keys(WM_LABEL) as WorkMode[]).map(k => (
          <View
            key={k}
            hoverClass="view-press"
            hoverStayTime="80"
            onClick={() => setWorkMode(k)}
            className={`rounded-xl py-2.5 text-sm font-semibold ${workMode === k ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={workMode === k ? 'text-mint-800' : 'text-mint-700/70'}>{WM_LABEL[k]}</Text>
          </View>
        ))}
      </View>

      {/* 输入区 + 快捷 */}
      <View className="rounded-2xl bg-white border border-mint-100 shadow-card p-4 flex flex-col gap-4">
        <View className="grid grid-cols-2 gap-3">
          <View>
            <Text className="text-xs font-medium text-mint-700/80">开始日期</Text>
            <View className="mt-1">
              <Picker mode="date" value={start} onChange={e => setStart(e.detail.value)}>
                <View className="w-full rounded-xl border border-mint-100 px-3 py-2 bg-mint-50/50">
                  <Text className="text-sm text-mint-900">📅 {start}</Text>
                </View>
              </Picker>
            </View>
          </View>
          <View>
            <Text className="text-xs font-medium text-mint-700/80">结束日期</Text>
            <View className="mt-1">
              <Picker mode="date" value={end} onChange={e => setEnd(e.detail.value)}>
                <View className="w-full rounded-xl border border-mint-100 px-3 py-2 bg-mint-50/50">
                  <Text className="text-sm text-mint-900">📅 {end}</Text>
                </View>
              </Picker>
            </View>
          </View>
        </View>

        <View className="flex flex-wrap gap-2">
          {[
            { label: '本周', apply: thisWeek },
            { label: '本月', apply: thisMonth },
            { label: '本季度', apply: thisQuarter },
            { label: '今年剩余', apply: yearRemain },
          ].map(p => (
            <View
              key={p.label}
              hoverClass="view-press"
              hoverStayTime="80"
              onClick={p.apply}
              className="text-xs px-3 py-1.5 rounded-full bg-mint-50 border border-mint-100"
            >
              <Text className="text-mint-700">⚡ {p.label}</Text>
            </View>
          ))}
        </View>

        {rangeResult && (
          <View className="flex flex-col gap-2 pt-1">
            <View className="grid grid-cols-2 gap-2">
              <Stat label="总天数"    value={rangeResult.total}   color="bg-mint-50" text="text-mint-800" />
              <Stat label="工作日 📗" value={rangeResult.work}    color="bg-emerald-50" text="text-emerald-800" />
              <Stat label="周末"      value={rangeResult.weekend} color="bg-sky-50" text="text-sky-800" />
              <Stat label="法定假 🎋" value={rangeResult.hol}     color="bg-rose-50" text="text-rose-800" />
              <Stat label="调休补班"  value={rangeResult.makeup}  color="bg-amber-50" text="text-amber-800" />
            </View>
            <View className="text-xs text-mint-700/70 bg-mint-50 border border-mint-100 rounded-xl px-3 py-2 leading-relaxed">
              <Text>
                📆 {rangeResult.realStart} → {rangeResult.realEnd}，共 {rangeResult.total} 天，模式 {WM_LABEL[workMode]}，实际上班 {rangeResult.work} 天
                {rangeResult.makeup > 0 ? `（含 ${rangeResult.makeup} 个周末调休补班日）` : ''}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 日历 */}
      <View className="flex flex-col gap-5">
        <View className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/70 border border-mint-100 shadow-card px-4 py-2.5 text-xs">
          <Legend box="bg-emerald-400/90" text="工作日" />
          <Legend box="bg-sky-100 border border-sky-200" text="周末" />
          <Legend box="bg-rose-400/90" text="法定假" />
          <Legend box="bg-amber-400/90" text="调休上班" />
          <Legend box="bg-white border border-mint-200" text="非工作日" />
        </View>
        {months.map(mo => (
          <MonthCalendar
            key={mo.key}
            month={mo}
            classifyDay={classifyDay}
            highlightStart={rangeResult?.realStart ?? start}
            highlightEnd={rangeResult?.realEnd ?? end}
          />
        ))}
      </View>

      <View className="text-center">
        <Text className="text-[11px] text-mint-700/60">* 内置节假日为 2025 / 2026 简化版，具体以国务院每年最终发布通知为准。</Text>
      </View>
    </View>
  )
}

// ============ helpers ============
const Stat: React.FC<{ label: string; value: number | string; color: string; text: string }> = ({ label, value, color, text }) => (
  <View className={`rounded-xl px-3 py-3 ${color} shadow-sm`}>
    <Text className="text-[10px] opacity-75 font-medium">{label}</Text>
    <Text className={`block text-xl font-bold mt-1 ${text}`}>{value}</Text>
  </View>
)

const Legend: React.FC<{ box: string; text: string }> = ({ box, text }) => (
  <View className="flex items-center gap-1.5">
    <View className={`w-4 h-4 rounded ${box}`} />
    <Text className="text-mint-700">{text}</Text>
  </View>
)

interface MonthBlock {
  key: string
  title: string
  weeks: Array<Array<{ ymd: string; day: number; kind: CellKind | 'empty' }>>
}

function buildMonths(start: string, end: string): MonthBlock[] {
  if (!start || !end) return []
  let [s, e] = [PARSE(start), PARSE(end)]
  if (s > e) { const tmp = s; s = e; e = tmp }
  const first = new Date(s.getFullYear(), s.getMonth(), 1)
  const last  = new Date(e.getFullYear(), e.getMonth(), 1)
  const months: MonthBlock[] = []
  for (let cur = new Date(first); cur <= last; cur.setMonth(cur.getMonth() + 1)) {
    const y = cur.getFullYear(), m = cur.getMonth()
    const title = `${y} 年 ${MONTH_CN[m]}`
    const key = `${y}-${m + 1}`
    const day1Dow = (new Date(y, m, 1).getDay() + 6) % 7   // Monday = 0
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const weeks: MonthBlock['weeks'] = []
    let week: MonthBlock['weeks'][number] = []
    for (let i = 0; i < day1Dow; i++) week.push({ ymd: '', day: 0, kind: 'empty' })
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = YMD(new Date(y, m, d))
      week.push({ ymd, day: d, kind: 'work' }) // kind 渲染时再 classify
      if (week.length === 7) { weeks.push(week); week = [] }
    }
    if (week.length) {
      while (week.length < 7) week.push({ ymd: '', day: 0, kind: 'empty' })
      weeks.push(week)
    }
    months.push({ key, title, weeks })
  }
  return months
}

function cellClass(kind: CellKind | 'empty', inRange: boolean, isToday: boolean): string {
  if (kind === 'empty') return 'bg-transparent border-transparent'
  const base = 'w-10 h-10 rounded-lg flex flex-col items-center justify-center text-sm relative select-none'
  let cls = 'text-mint-900 border border-mint-100 bg-white shadow-sm'
  if (kind === 'work') cls = 'text-white bg-emerald-400/90 border-emerald-500 shadow-sm font-semibold'
  if (kind === 'weekend') cls = 'bg-sky-100 text-sky-800 border border-sky-200 font-medium'
  if (kind === 'holiday') cls = 'text-white bg-rose-400/90 border-rose-500 shadow-sm font-semibold'
  if (kind === 'makeup') cls = 'text-white bg-amber-400/90 border-amber-500 shadow-sm font-semibold'
  const rangeRing = inRange ? 'ring-2 ring-mint-600/60 ring-offset-1 ring-offset-mint-50' : ''
  const todayRing = isToday ? 'outline outline-2 outline-offset-1 outline-rose-500' : ''
  return `${base} ${cls} ${rangeRing} ${todayRing}`
}

function cellTag(kind: CellKind | 'empty'): string {
  if (kind === 'holiday') return '假'
  if (kind === 'makeup')  return '班'
  if (kind === 'weekend') return '休'
  return ''
}

function MonthCalendar(props: {
  month: MonthBlock
  classifyDay: (ymd: string) => CellKind
  highlightStart: string
  highlightEnd: string
}) {
  const { month, classifyDay, highlightStart, highlightEnd } = props
  const todayYMD = YMD(new Date())
  let s = highlightStart, e = highlightEnd
  if (s && e && s > e) { const tmp = s; s = e; e = tmp }

  return (
    <View className="rounded-2xl bg-white border border-mint-100 shadow-card p-4">
      <View className="mb-3">
        <Text className="text-base font-bold text-mint-900">{month.title}</Text>
        <View className="mt-2 grid grid-cols-7 gap-1 text-center">
          {['一','二','三','四','五','六','日'].map((d, i) => (
            <Text key={i} className={`text-[10px] font-medium ${i >= 5 ? 'text-sky-700' : 'text-mint-700/70'}`}>{d}</Text>
          ))}
        </View>
      </View>
      <View className="flex flex-col gap-1.5">
        {month.weeks.map((wk, wi) => (
          <View key={wi} className="grid grid-cols-7 gap-1">
            {wk.map((c, di) => {
              if (c.kind === 'empty') return <View key={di} className={cellClass('empty', false, false)}><Text> </Text></View>
              const k = classifyDay(c.ymd)
              const inRange = !!s && !!e && c.ymd >= s && c.ymd <= e
              const ist = c.ymd === todayYMD
              const tag = cellTag(k)
              return (
                <View key={di} className={cellClass(k, inRange, ist)}>
                  <Text className="leading-tight">{c.day}</Text>
                  {tag ? <Text className="absolute top-0 right-1 text-[9px] font-bold opacity-85 leading-none">{tag}</Text> : null}
                  {ist ? <Text className="absolute bottom-0.5 text-[8px] font-bold text-rose-600 opacity-80 leading-none">今</Text> : null}
                </View>
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

export default Workdays
