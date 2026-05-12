function fmt(cents) {
  if (cents == null || cents < 0) return '—'
  const val = cents / 100
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + 'M'
  if (val >= 1_000) return (val / 1_000).toFixed(2) + 'K'
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtQty(n) {
  if (n == null || n < 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function pctChange(history) {
  if (!history || history.length < 2) return null
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const oldest = sorted[0].avgPrice
  const newest = sorted[sorted.length - 1].avgPrice
  if (!oldest || oldest <= 0) return null
  return ((newest - oldest) / oldest) * 100
}

function Card({ label, value, sub, accent }) {
  return (
    <div style={{ ...styles.card, ...(accent ? { borderTop: `2px solid ${accent}` } : {}) }}>
      <div style={styles.label}>{label}</div>
      <div className="num" style={styles.value}>{value}</div>
      {sub && <div style={styles.sub}>{sub}</div>}
    </div>
  )
}

export default function StatCards({ details, matName }) {
  if (!details) {
    return (
      <div style={styles.grid}>
        {['Current Price', 'Avg Price', 'Supply', 'Daily Volume', '30d Change'].map(l => (
          <Card key={l} label={l} value="—" />
        ))}
      </div>
    )
  }

  const change = pctChange(details.priceHistory)
  const changeColor = change === null ? 'var(--text-muted)' : change >= 0 ? 'var(--green)' : 'var(--red)'

  return (
    <div style={styles.grid}>
      <Card
        label="Current Price"
        value={`${fmt(details.currentPrice)} cr`}
        accent="var(--accent)"
      />
      <Card
        label="Avg Price (30d)"
        value={`${fmt(details.avgPrice)} cr`}
      />
      <Card
        label="Supply"
        value={fmtQty(details.totalQtyAvailable)}
        sub="units available"
      />
      <Card
        label="Daily Volume"
        value={fmtQty(details.avgQtySoldDaily)}
        sub="avg units/day"
      />
      <Card
        label="30d Change"
        value={change === null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
        accent={changeColor}
      />
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
  },
  card: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '14px 16px',
    boxShadow: 'var(--card-shadow)',
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-.02em',
    lineHeight: 1.2,
  },
  sub: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
}
