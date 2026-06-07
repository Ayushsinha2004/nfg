import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { count, rowsAll } from '../lib/nfg'

// Same stated assumption as the report spec: 3 minutes (0.05 h) saved per
// member message Matt AI handles. If this changes in the spec, change it here.
const HOURS_SAVED_PER_MESSAGE = 0.05
const REFRESH_MS = 60 * 1000

export const TIME_FILTERS = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: 'all', label: 'All time', days: null },
]
export const filterLabel = (k) => (TIME_FILTERS.find((f) => f.key === k) || {}).label || k

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function dayKey(d) { return startOfDay(d).toISOString().slice(0, 10) }
function weekStart(d) { const x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x } // Monday

function buildBuckets(msgs, start, end, granularity) {
  const buckets = []
  const idx = {}
  const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short' })
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  if (granularity === 'day') {
    const spanDays = Math.round((startOfDay(end) - startOfDay(start)) / 86400000)
    const label = spanDays <= 7 ? fmtDay : fmtDate
    for (let d = startOfDay(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = dayKey(d); idx[k] = buckets.length
      buckets.push({ key: k, label: label(d), count: 0 })
    }
    msgs.forEach((m) => { const k = dayKey(m.created_at); if (k in idx) buckets[idx[k]].count++ })
  } else {
    for (let d = weekStart(start); d <= end; d.setDate(d.getDate() + 7)) {
      const k = dayKey(d); idx[k] = buckets.length
      buckets.push({ key: k, label: fmtDate(d), count: 0 })
    }
    msgs.forEach((m) => { const k = dayKey(weekStart(m.created_at)); if (k in idx) buckets[idx[k]].count++ })
  }

  let cum = 0
  return buckets.map((b) => {
    cum += b.count * HOURS_SAVED_PER_MESSAGE
    return { ...b, hours: +(b.count * HOURS_SAVED_PER_MESSAGE).toFixed(1), cumHours: +cum.toFixed(1) }
  })
}

function computeWindow(raw, filter) {
  const def = TIME_FILTERS.find((f) => f.key === filter) || TIME_FILTERS[0]
  const now = new Date()
  let start
  if (def.days == null) start = raw.firstDate ? new Date(raw.firstDate) : now
  else { start = startOfDay(now); start.setDate(start.getDate() - (def.days - 1)) }
  const startMs = startOfDay(start).getTime()

  const win = raw.msgs.filter((m) => new Date(m.created_at).getTime() >= startMs)
  const messages = win.length
  const handover = win.filter((m) => m.status === 'handover').length
  const reached = new Set(win.map((m) => m.phone_number).filter(Boolean)).size
  const granularity = def.days != null && def.days <= 30 ? 'day' : 'week'

  return {
    messages,
    time_saved_h: +(messages * HOURS_SAVED_PER_MESSAGE).toFixed(1),
    handover,
    handover_rate: messages ? Math.round((handover / messages) * 100) : 0,
    reached,
    buckets: buildBuckets(win, start, now, granularity),
    granularity,
  }
}

export function useNfgData(timeFilter = '7d') {
  const raw = useRef(null)               // { counts, tiers, msgs, firstDate, fetchedAt }
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const [gyms, membersTotal, green, yellow, red, msgs] = await Promise.all([
        count('gyms', 'parent_gym_id=is.null'),
        count('members'),
        count('members', 'engagement_tier=eq.green'),
        count('members', 'engagement_tier=eq.yellow'),
        count('members', 'engagement_tier=eq.red'),
        rowsAll('inbox_messages', 'select=created_at,status,phone_number&order=created_at.desc'),
      ])
      const tierTotal = green + yellow + red || 1
      raw.current = {
        counts: { gyms, membersTotal },
        tiers: [
          { name: 'Highly engaged', key: 'green', value: green, pct: Math.round((green / tierTotal) * 100) },
          { name: 'Active', key: 'yellow', value: yellow, pct: Math.round((yellow / tierTotal) * 100) },
          { name: 'At risk', key: 'red', value: red, pct: Math.round((red / tierTotal) * 100) },
        ],
        msgs,
        firstDate: msgs.length ? msgs[msgs.length - 1].created_at : null, // DESC → last is oldest
        dataThrough: msgs.length ? msgs[0].created_at.slice(0, 10) : null, // DESC → first is newest
      }
      setError(null)
      setVersion((v) => v + 1)
    } catch (err) {
      setError(err.message || 'Failed to load live data from NFG Supabase')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  // Recompute the windowed view whenever the filter changes or fresh data arrives.
  // No refetch on filter change — the full history is cached in `raw`.
  const data = useMemo(() => {
    const r = raw.current
    if (!r) return null
    const w = computeWindow(r, timeFilter)
    return {
      kpis: {
        messages: w.messages,
        time_saved_h: w.time_saved_h,
        members_total: r.counts.membersTotal,
        gyms_served: r.counts.gyms,
        reached: w.reached,
        handover_rate: w.handover_rate,
      },
      tiers: r.tiers,
      buckets: w.buckets,
      granularity: w.granularity,
      dataThrough: r.dataThrough,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, version])

  return { data, loading, error, reload: load }
}
