import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' }

export function RiskDistribution({ tiers }) {
  if (!tiers) return null
  const total = tiers.reduce((s, t) => s + t.value, 0)
  const atRisk = tiers.find((t) => t.key === 'red')
  return (
    <div className="card">
      <div className="panel-head">
        <span className="panel-title">Member engagement</span>
        <span className="hint">{total.toLocaleString('en-GB')} members</span>
      </div>
      <div style={{ position: 'relative', padding: '6px 0 0' }}>
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie data={tiers} dataKey="value" nameKey="name" cx="50%" cy="50%"
                 innerRadius={52} outerRadius={74} paddingAngle={2} stroke="none">
              {tiers.map((t) => <Cell key={t.key} fill={COLORS[t.key]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.red }}>{atRisk?.pct ?? 0}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 0.5 }}>AT RISK</div>
          </div>
        </div>
      </div>
      <div className="legend">
        {tiers.map((t) => (
          <div className="legend-row" key={t.key}>
            <span className="legend-left">
              <span className="legend-dot" style={{ background: COLORS[t.key] }} />{t.name}
            </span>
            <span><span className="legend-val">{t.value.toLocaleString('en-GB')}</span>
              <span className="legend-pct">{t.pct}%</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}
