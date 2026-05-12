import { useMemo } from 'react'
import { fmtCredits, fmtQty, fmtPct, fmtCreditsRaw } from '../lib/format.js'
import { calcHistoryMetrics } from '../lib/metrics.js'

function Card({ label, value, sub, accent, dim }) {
  return (
    <div style={{
      ...styles.card,
      ...(accent ? { borderTop: `2px solid ${accent}` } : {}),
      ...(dim    ? { opacity: 0.5 } : {}),
    }}>
      <div style={styles.label}>{label}</div>
      <div className="num" style={styles.value}>{value}</div>
      {sub && <div style={styles.sub}>{sub}</div>}
    </div>
  )
}

export default function StatCards({ details }) {
  const hist = useMemo(
    () => details ? calcHistoryMetrics(
      details.priceHistory,
      details.totalQtyAvailable,
      details.avgQtySoldDaily
    ) : null,
    [details]
  )

  if (!details) {
    return (
      <div style={styles.grid}>
        {['Current Price','Avg Price','Supply','Daily Volume','30d Change',
          'Volatility','Days of Supply','vs 30d VWAP'].map(l => (
          <Card key={l} label={l} value="—" dim />
        ))}
      </div>
    )
  }

  const change = hist?.change30d
  const changeColor = change == null ? 'var(--text-muted)'
    : change >= 0 ? 'var(--green)' : 'var(--red)'

  const premVwap = hist && hist.vwap30d > 0
    ? ((details.currentPrice - hist.vwap30d) / hist.vwap30d) * 100
    : null
  const premColor = premVwap == null ? 'var(--text-muted)'
    : premVwap <= 0 ? 'var(--green)' : 'var(--red)'

  return (
    <div style={styles.grid}>
      <Card
        label="Current Price"
        value={`${fmtCredits(details.currentPrice)} cr`}
        sub="best ask"
        accent="var(--accent)"
      />
      <Card
        label="30d Avg Price"
        value={`${fmtCredits(details.avgPrice)} cr`}
        sub="rolling average"
      />
      <Card
        label="Supply"
        value={fmtQty(details.totalQtyAvailable)}
        sub="units listed"
      />
      <Card
        label="Daily Volume"
        value={fmtQty(details.avgQtySoldDaily)}
        sub="units/day avg"
      />
      <Card
        label="30d Change"
        value={change == null ? '—' : fmtPct(change)}
        sub="vs 30d ago"
        accent={changeColor}
      />
      <Card
        label="Volatility"
        value={hist?.volatility != null ? fmtPct(hist.volatility * 100, 1) : '—'}
        sub="price stddev / mean"
      />
      <Card
        label="Days of Supply"
        value={hist?.daysOfSupply != null ? hist.daysOfSupply.toFixed(1) : '—'}
        sub="at current sell rate"
      />
      <Card
        label="vs 30d VWAP"
        value={premVwap == null ? '—' : fmtPct(premVwap)}
        sub={hist?.vwap30d ? `VWAP ${fmtCredits(hist.vwap30d)} cr` : 'insufficient data'}
        accent={premColor}
      />
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
    gap: 10,
  },
  card: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '13px 15px',
    boxShadow: 'var(--card-shadow)',
  },
  label: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-.03em',
    lineHeight: 1.2,
  },
  sub: {
    fontSize: 10,
    color: 'var(--text-muted)',
    marginTop: 4,
    lineHeight: 1.3,
  },
}
