import { useMemo, useState } from 'react'
import { fmtCredits, fmtQty, fmtCreditsRaw, fmtPct } from '../lib/format.js'
import { calcL2Metrics, calcPriceImpact } from '../lib/metrics.js'

function MetricCard({ label, value, sub, accent, tooltip }) {
  const [showTip, setShowTip] = useState(false)
  return (
    <div
      style={{ ...styles.card, ...(accent ? { borderLeft: `3px solid ${accent}` } : {}) }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div style={styles.label}>
        {label}
        {tooltip && <span style={styles.tipIcon}>?</span>}
      </div>
      <div className="num" style={styles.value}>{value}</div>
      {sub && <div style={styles.sub}>{sub}</div>}
      {showTip && tooltip && <div style={styles.tipBox}>{tooltip}</div>}
    </div>
  )
}

const IMPACT_SIZES = [1_000, 10_000, 100_000, 1_000_000]

export default function LiquidityPanel({ orders }) {
  const metrics = useMemo(() => orders ? calcL2Metrics(orders) : null, [orders])
  const [impactQty, setImpactQty] = useState(10_000)
  const impact = useMemo(
    () => orders ? calcPriceImpact(orders, impactQty) : null,
    [orders, impactQty]
  )

  if (!metrics) {
    return <div style={styles.empty}>Select a material to see liquidity analysis</div>
  }

  const wallName = metrics.largestOrder?.cName ?? metrics.largestOrder?.company_name ?? '—'

  return (
    <div style={styles.wrap}>
      <div style={styles.sectionTitle}>Liquidity Analysis</div>

      <div style={styles.grid}>
        <MetricCard
          label="Total Supply"
          value={fmtQty(metrics.totalSupply)}
          sub="units listed on market"
        />
        <MetricCard
          label="Total Liquidity"
          value={`${fmtCreditsRaw(metrics.totalLiquidity / 100)} cr`}
          sub="total value locked in orders"
          tooltip="Sum of (price × qty) across all open sell orders"
        />
        <MetricCard
          label="Weighted Avg Ask"
          value={`${fmtCredits(metrics.weightedAvgAsk)} cr`}
          sub={`best ask: ${fmtCredits(metrics.bestAsk)} cr`}
          tooltip="VWAP of the order book — what you'd pay if buying all available supply at once"
        />
        <MetricCard
          label="Sellers"
          value={`${metrics.sellerCount}`}
          sub={`across ${metrics.priceLevelCount} price levels`}
        />
        <MetricCard
          label="Top-3 Concentration"
          value={fmtPct(metrics.top3Concentration, 1)}
          sub="of supply from 3 largest sellers"
          accent={metrics.top3Concentration > 80 ? 'var(--red)' : metrics.top3Concentration > 50 ? 'var(--gold)' : 'var(--green)'}
          tooltip="High concentration = one seller could dominate pricing. >80% = monopoly risk"
        />
        <MetricCard
          label="Largest Order (Wall)"
          value={fmtQty(metrics.largestOrder?.qty)}
          sub={wallName}
          tooltip="The single biggest sell order — acts as a price resistance wall"
        />
        <MetricCard
          label="Depth within +10%"
          value={fmtQty(metrics.depth10pct)}
          sub={`${metrics.totalSupply > 0 ? ((metrics.depth10pct / metrics.totalSupply) * 100).toFixed(1) : 0}% of total`}
          tooltip="Units available within 10% above the best ask price"
        />
        <MetricCard
          label="Depth within +20%"
          value={fmtQty(metrics.depth20pct)}
          sub={`${metrics.totalSupply > 0 ? ((metrics.depth20pct / metrics.totalSupply) * 100).toFixed(1) : 0}% of total`}
        />
        <MetricCard
          label="Depth within +50%"
          value={fmtQty(metrics.depth50pct)}
          sub={`${metrics.totalSupply > 0 ? ((metrics.depth50pct / metrics.totalSupply) * 100).toFixed(1) : 0}% of total`}
        />
      </div>

      {/* Price impact simulator */}
      <div style={styles.impactSection}>
        <div style={styles.impactTitle}>Price Impact Simulator</div>
        <div style={styles.impactRow}>
          <span style={styles.impactLabel}>Buy</span>
          <div style={styles.sizeButtons}>
            {IMPACT_SIZES.map(s => (
              <button
                key={s}
                style={{ ...styles.sizeBtn, ...(impactQty === s ? styles.sizeBtnActive : {}) }}
                onClick={() => setImpactQty(s)}
              >
                {fmtQty(s)}
              </button>
            ))}
          </div>
          <span style={styles.impactLabel}>units</span>
        </div>

        {impact ? (
          <div style={styles.impactResult}>
            <div style={styles.impactStat}>
              <span style={styles.impactStatLabel}>Avg cost</span>
              <span className="num" style={styles.impactStatVal}>{fmtCredits(impact.avgPrice)} cr/unit</span>
            </div>
            <div style={styles.impactStat}>
              <span style={styles.impactStatLabel}>Total cost</span>
              <span className="num" style={styles.impactStatVal}>{fmtCreditsRaw(impact.totalCost / 100)} cr</span>
            </div>
            <div style={styles.impactStat}>
              <span style={styles.impactStatLabel}>Slippage</span>
              <span className="num" style={{
                ...styles.impactStatVal,
                color: impact.slippage > 5 ? 'var(--red)' : impact.slippage > 1 ? 'var(--gold)' : 'var(--green)',
              }}>
                {fmtPct(impact.slippage)}
              </span>
            </div>
            <div style={styles.impactStat}>
              <span style={styles.impactStatLabel}>Can fill?</span>
              <span style={{ fontSize: 13, color: impact.canFill ? 'var(--green)' : 'var(--red)' }}>
                {impact.canFill ? '✓ Yes' : `✗ Only ${fmtQty(impact.filled)}`}
              </span>
            </div>
          </div>
        ) : (
          <div style={styles.impactEmpty}>Insufficient orders to simulate</div>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: 16,
    boxShadow: 'var(--card-shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.05em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 8,
  },
  card: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    position: 'relative',
    cursor: 'default',
  },
  label: {
    fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.05em',
    marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4,
  },
  tipIcon: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 13, height: 13, borderRadius: '50%',
    background: 'var(--border)', color: 'var(--text-muted)',
    fontSize: 9, fontWeight: 700, cursor: 'help',
  },
  value: {
    fontSize: 15, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.2,
  },
  sub: {
    fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.3,
  },
  tipBox: {
    position: 'absolute', bottom: '100%', left: 0, right: 0,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '8px 10px',
    fontSize: 11, color: 'var(--text)', lineHeight: 1.5,
    zIndex: 10, boxShadow: 'var(--card-shadow)',
    marginBottom: 4,
  },
  // Price impact section
  impactSection: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: 12,
  },
  impactTitle: {
    fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10,
  },
  impactRow: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10,
  },
  impactLabel: { fontSize: 12, color: 'var(--text-muted)' },
  sizeButtons: {
    display: 'flex', gap: 4, flexWrap: 'wrap',
  },
  sizeBtn: {
    padding: '3px 9px',
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-muted)',
    fontSize: 11,
    fontFamily: 'Space Mono, monospace',
    cursor: 'pointer',
  },
  sizeBtnActive: {
    background: 'var(--accent)',
    borderColor: 'var(--accent)',
    color: '#fff',
  },
  impactResult: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
  },
  impactStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  impactStatLabel: {
    fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em',
  },
  impactStatVal: {
    fontSize: 13, fontWeight: 700,
  },
  impactEmpty: {
    color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 8,
  },
  empty: {
    padding: 24, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center',
  },
}
