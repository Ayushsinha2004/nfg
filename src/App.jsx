import { useState } from 'react'
import { useNfgData, filterLabel } from './hooks/useNfgData'
import { Header } from './components/Header'
import { KpiCards } from './components/KpiCards'
import { ConversationVolume } from './components/ConversationVolume'
import { RiskDistribution } from './components/RiskDistribution'
import { ValueTrend } from './components/ValueTrend'

export default function App() {
  const [timeFilter, setTimeFilter] = useState('7d')
  const { data, loading, error } = useNfgData(timeFilter)
  const label = filterLabel(timeFilter)

  if (loading && !data) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading NFG.AI performance…</span>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Header
        dataThrough={data?.dataThrough}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
      />

      {error && <div className="banner-err">Couldn’t reach the live feed: {error}</div>}

      <p className="section-label">{label} · at a glance</p>
      <KpiCards kpis={data?.kpis} windowLabel={label} />

      <p className="section-label">Activity &amp; engagement</p>
      <div className="grid-2">
        <ConversationVolume buckets={data?.buckets || []} windowLabel={label} granularity={data?.granularity} />
        <RiskDistribution tiers={data?.tiers} />
      </div>

      <p className="section-label">Value trend</p>
      <ValueTrend buckets={data?.buckets || []} windowLabel={label} granularity={data?.granularity} />

      <p className="note">
        Live, read-only view of Matt AI’s value to Nutrition for Gyms. Messages handled and time
        saved are counted from the platform’s own records for the selected window; “time given back”
        uses a conservative ~3 minutes saved per message handled. Member engagement reflects the
        current tier of every member on the platform.
      </p>
    </div>
  )
}
