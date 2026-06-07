import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function ValueTrend({ buckets, windowLabel, granularity }) {
  const unitWord = granularity === 'week' ? 'week' : 'day'
  return (
    <div className="card">
      <div className="panel-head">
        <span className="panel-title">Value delivered</span>
        <span className="hint">messages handled &amp; cumulative hours saved · {windowLabel} · per {unitWord}</span>
      </div>
      <div style={{ padding: '14px 12px 16px' }}>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={buckets} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid stroke="#242932" vertical={false} />
            <XAxis dataKey="label" stroke="#5f6773" tickLine={false} axisLine={false} fontSize={12}
                   minTickGap={18} interval="preserveStartEnd" />
            <YAxis yAxisId="l" stroke="#5f6773" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
            <YAxis yAxisId="r" orientation="right" stroke="#5f6773" tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip
              contentStyle={{ background: '#14171d', border: '1px solid #242932', borderRadius: 8, color: '#f3f5f7' }}
              labelStyle={{ color: '#8a929e' }}
              formatter={(v, name) => name === 'cumHours' ? [`${v} hrs`, 'Cumulative hours saved'] : [`${v}`, 'Messages handled']}
            />
            <Bar yAxisId="l" dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={34} opacity={0.85} />
            <Line yAxisId="r" type="monotone" dataKey="cumHours" stroke="#eab308" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
