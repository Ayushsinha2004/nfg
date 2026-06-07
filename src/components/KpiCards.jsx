function fmt(n) { return (n ?? 0).toLocaleString('en-GB') }

export function KpiCards({ kpis, windowLabel = 'this period' }) {
  if (!kpis) return null
  const win = windowLabel.toLowerCase()
  const cards = [
    {
      label: 'Messages handled by Matt AI',
      value: fmt(kpis.messages),
      foot: <>over {win} · <b>{kpis.handover_rate}%</b> needed a human handover</>,
    },
    {
      label: 'Time given back to Matty',
      value: kpis.time_saved_h, unit: 'hrs',
      foot: <>over {win} · ~3 min saved per message handled</>,
    },
    {
      label: 'Members on the platform',
      value: fmt(kpis.members_total),
      foot: <><b>{fmt(kpis.reached)}</b> reached over {win}</>,
    },
    {
      label: 'Gyms served',
      value: fmt(kpis.gyms_served),
      foot: <>partner gyms live on Matt AI</>,
    },
  ]
  return (
    <div className="kpi-grid">
      {cards.map((c) => (
        <div className="kpi" key={c.label}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value">{c.value}{c.unit && <span className="unit">{c.unit}</span>}</div>
          <div className="kpi-foot">{c.foot}</div>
        </div>
      ))}
    </div>
  )
}
