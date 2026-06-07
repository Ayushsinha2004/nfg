import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function ConversationVolume({ buckets, windowLabel, granularity }) {
  const unitWord = granularity === 'week' ? 'week' : 'day'
  return (
    <div className="card">
      <div className="panel-head">
        <span className="panel-title">Conversation volume</span>
        <span className="hint">{windowLabel} · per {unitWord}</span>
      </div>
      <div style={{ padding: '14px 12px 16px' }}>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={buckets} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="cv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#242932" vertical={false} />
            <XAxis dataKey="label" stroke="#5f6773" tickLine={false} axisLine={false} fontSize={12}
                   minTickGap={18} interval="preserveStartEnd" />
            <YAxis stroke="#5f6773" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#14171d', border: '1px solid #242932', borderRadius: 8, color: '#f3f5f7' }}
              labelStyle={{ color: '#8a929e' }}
              formatter={(v) => [`${v} messages`, 'Handled']}
            />
            <Area type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2.5} fill="url(#cv)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
