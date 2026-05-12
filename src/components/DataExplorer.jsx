import { useMemo } from 'react'
import { fmtCredits, fmtCreditsExact, fmtQty, fmtPct, shortDate } from '../lib/format.js'
import { calcL2Metrics, calcHistoryMetrics } from '../lib/metrics.js'

const RAW_FIELDS = [
  {
    field: 'matId',
    type: 'integer',
    source: 'mat-prices + mat-details',
    desc: 'Unique material identifier. Stable across sessions.',
    derive: d => d?.matId,
  },
  {
    field: 'matName',
    type: 'string',
    source: 'mat-prices + mat-details',
    desc: 'Human-readable name of the tradeable material.',
    derive: d => d?.matName,
  },
  {
    field: 'currentPrice',
    type: 'integer (cents)',
    source: 'mat-prices + mat-details',
    desc: 'The lowest ask price currently in the order book. Divide by 100 for credits.',
    derive: d => d ? `${d.currentPrice} → ${fmtCreditsExact(d.currentPrice)} cr` : '—',
  },
  {
    field: 'avgPrice',
    type: 'integer (cents)',
    source: 'mat-prices + mat-details',
    desc: '30-day rolling average transaction price. Used to gauge whether current price is high or low.',
    derive: d => d ? `${d.avgPrice} → ${fmtCreditsExact(d.avgPrice)} cr` : '—',
  },
  {
    field: 'totalQtyAvailable',
    type: 'integer',
    source: 'mat-details',
    desc: 'Sum of qty across ALL open sell orders right now. This is the total on-market supply.',
    derive: d => d ? fmtQty(d.totalQtyAvailable) + ' units' : '—',
  },
  {
    field: 'avgQtySoldDaily',
    type: 'integer',
    source: 'mat-details',
    desc: 'Average units sold per day through the exchange over the measurement window.',
    derive: d => d ? fmtQty(d.avgQtySoldDaily) + ' units/day' : '—',
  },
  {
    field: 'orders[]',
    type: 'array of objects',
    source: 'mat-details',
    desc: 'The FULL sell-side order book (Level 2). Each entry: {id, cId, cName, unitPrice, qty}. Sorted by price ascending.',
    derive: d => d ? `${d.orders?.length ?? 0} orders` : '—',
  },
  {
    field: 'orders[].unitPrice',
    type: 'integer (cents)',
    source: 'mat-details → orders',
    desc: 'Price per unit for this sell order. Multiple orders can exist at the same price level.',
    derive: d => d?.orders?.[0] ? `Best: ${fmtCreditsExact(d.orders[0].unitPrice)} cr` : '—',
  },
  {
    field: 'orders[].qty',
    type: 'integer',
    source: 'mat-details → orders',
    desc: 'Units available in this specific sell order.',
    derive: d => d?.orders?.[0] ? `Smallest: ${fmtQty(Math.min(...(d.orders||[]).map(o=>o.qty)))}` : '—',
  },
  {
    field: 'orders[].cName',
    type: 'string',
    source: 'mat-details → orders',
    desc: 'Company name of the seller. cId is the numeric company ID.',
    derive: d => d?.orders?.[0]?.cName ?? '—',
  },
  {
    field: 'priceHistory[]',
    type: 'array of objects',
    source: 'mat-details',
    desc: 'Up to 30 daily records. Each: {date, avgPrice, qtySold, qtyRemaining, qtyC}.',
    derive: d => d ? `${d.priceHistory?.length ?? 0} days of data` : '—',
  },
  {
    field: 'priceHistory[].date',
    type: 'string (YYYY-MM-DD)',
    source: 'mat-details → priceHistory',
    desc: 'Calendar date for this history entry.',
    derive: d => d?.priceHistory?.[0] ? shortDate(d.priceHistory[d.priceHistory.length-1].date) + ' (latest)' : '—',
  },
  {
    field: 'priceHistory[].avgPrice',
    type: 'integer (cents)',
    source: 'mat-details → priceHistory',
    desc: 'Volume-weighted average transaction price for that day.',
    derive: d => {
      if (!d?.priceHistory?.length) return '—'
      const today = d.priceHistory[d.priceHistory.length - 1]
      return `${fmtCreditsExact(today.avgPrice)} cr (latest day)`
    },
  },
  {
    field: 'priceHistory[].qtySold',
    type: 'integer',
    source: 'mat-details → priceHistory',
    desc: 'Total units sold through the exchange that day.',
    derive: d => {
      if (!d?.priceHistory?.length) return '—'
      const tot = d.priceHistory.reduce((s,h)=>s+h.qtySold,0)
      return `${fmtQty(tot)} (30d total)`
    },
  },
  {
    field: 'priceHistory[].qtyRemaining',
    type: 'integer',
    source: 'mat-details → priceHistory',
    desc: 'Total supply on the market at the end of that day. Tracks supply trend over time.',
    derive: d => {
      if (!d?.priceHistory?.length) return '—'
      const today = d.priceHistory[d.priceHistory.length - 1]
      return fmtQty(today.qtyRemaining) + ' (latest)'
    },
  },
  {
    field: 'priceHistory[].qtyC',
    type: 'integer',
    source: 'mat-details → priceHistory',
    desc: '⚠ Undocumented field. Empirically tracks ~20–50% of qtySold. Hypothesis: production output listed that day, or quantity consumed by recipes. Treat as unverified.',
    derive: d => {
      if (!d?.priceHistory?.length) return '—'
      const latest = d.priceHistory[d.priceHistory.length - 1]
      const ratio = latest.qtySold > 0 ? (latest.qtyC / latest.qtySold * 100).toFixed(0) : '?'
      return `${fmtQty(latest.qtyC)} (${ratio}% of qtySold)`
    },
  },
]

function Row({ field, type, source, desc, value }) {
  return (
    <tr>
      <td style={styles.tdField}>
        <code style={styles.code}>{field}</code>
      </td>
      <td style={{ ...styles.td, color: 'var(--text-muted)', fontSize: 10 }}>{type}</td>
      <td style={styles.td}>{desc}</td>
      <td style={{ ...styles.td, ...styles.tdMono }}>{value}</td>
    </tr>
  )
}

function DerivedRow({ label, value, formula, color }) {
  return (
    <tr>
      <td style={styles.td}><strong style={{ fontSize: 12 }}>{label}</strong></td>
      <td style={{ ...styles.td, ...styles.tdMono, color: color ?? 'var(--text)' }}>{value}</td>
      <td style={{ ...styles.td, color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>{formula}</td>
    </tr>
  )
}

export default function DataExplorer({ details }) {
  const l2 = useMemo(() => details ? calcL2Metrics(details.orders) : null, [details])
  const hist = useMemo(
    () => details ? calcHistoryMetrics(details.priceHistory, details.totalQtyAvailable, details.avgQtySoldDaily) : null,
    [details]
  )

  const premVwap = hist && hist.vwap30d > 0
    ? ((details.currentPrice - hist.vwap30d) / hist.vwap30d) * 100
    : null

  return (
    <div style={styles.wrap}>
      {/* Section 1: Raw API fields */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>📡 Raw API Fields</div>
        <div style={styles.sectionDesc}>
          Every field returned by the Galactic Tycoons exchange API, with live values for the selected material.
        </div>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left' }}>Field</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Type</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Description</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Live Value</th>
              </tr>
            </thead>
            <tbody>
              {RAW_FIELDS.map(f => (
                <Row
                  key={f.field}
                  {...f}
                  value={f.derive(details)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Derived metrics */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>🔬 Derived Secondary Metrics</div>
        <div style={styles.sectionDesc}>
          All metrics computable from the raw data above. These are not in the API — we calculate them client-side.
        </div>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left' }}>Metric</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Value</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Formula / Source</th>
              </tr>
            </thead>
            <tbody>
              {/* L2 derived */}
              <tr><td colSpan={3} style={styles.groupHeader}>From Order Book (Level 2)</td></tr>
              <DerivedRow label="Total Supply" value={l2 ? fmtQty(l2.totalSupply) : '—'} formula="Σ orders[].qty" />
              <DerivedRow label="Total Liquidity" value={l2 ? `${fmtCreditsExact(l2.totalLiquidity)} cr` : '—'} formula="Σ (unitPrice × qty)" />
              <DerivedRow label="Weighted Avg Ask (WAA)" value={l2 ? `${fmtCredits(l2.weightedAvgAsk)} cr` : '—'} formula="Σ(unitPrice×qty) / Σqty — VWAP of asks" />
              <DerivedRow label="WAA vs Best Ask" value={l2 && l2.bestAsk > 0 ? fmtPct((l2.weightedAvgAsk - l2.bestAsk) / l2.bestAsk * 100) : '—'} formula="(WAA - bestAsk) / bestAsk" />
              <DerivedRow label="Unique Sellers" value={l2 ? `${l2.sellerCount}` : '—'} formula="COUNT(DISTINCT cId)" />
              <DerivedRow label="Price Levels" value={l2 ? `${l2.priceLevelCount}` : '—'} formula="COUNT(DISTINCT unitPrice)" />
              <DerivedRow label="Largest Wall" value={l2 ? `${fmtQty(l2.largestOrder?.qty)} by ${l2.largestOrder?.cName ?? '—'}` : '—'} formula="MAX(qty) across all orders" />
              <DerivedRow label="Top-3 Concentration" value={l2 ? fmtPct(l2.top3Concentration, 1) : '—'} formula="(top3 seller qty) / totalSupply × 100" />
              <DerivedRow label="Depth within +10%" value={l2 ? fmtQty(l2.depth10pct) : '—'} formula="Σqty where unitPrice ≤ bestAsk × 1.10" />
              <DerivedRow label="Depth within +20%" value={l2 ? fmtQty(l2.depth20pct) : '—'} formula="Σqty where unitPrice ≤ bestAsk × 1.20" />
              <DerivedRow label="Depth within +50%" value={l2 ? fmtQty(l2.depth50pct) : '—'} formula="Σqty where unitPrice ≤ bestAsk × 1.50" />

              {/* History derived */}
              <tr><td colSpan={3} style={styles.groupHeader}>From Price History (30 days)</td></tr>
              <DerivedRow label="30d VWAP" value={hist ? `${fmtCredits(hist.vwap30d)} cr` : '—'} formula="Σ(avgPrice×qtySold) / Σqtₐₗₗ" />
              <DerivedRow
                label="Current vs 30d VWAP"
                value={premVwap != null ? fmtPct(premVwap) : '—'}
                formula="(currentPrice − vwap30d) / vwap30d"
                color={premVwap == null ? undefined : premVwap <= 0 ? 'var(--green)' : 'var(--red)'}
              />
              <DerivedRow label="30d % Change" value={hist?.change30d != null ? fmtPct(hist.change30d) : '—'} formula="(latest avgPrice − oldest avgPrice) / oldest" />
              <DerivedRow label="Price Volatility" value={hist ? fmtPct(hist.volatility * 100, 1) : '—'} formula="stddev(daily prices) / mean — coefficient of variation" />
              <DerivedRow label="30d High" value={hist ? `${fmtCredits(hist.priceHigh)} cr` : '—'} formula="MAX(priceHistory[].avgPrice)" />
              <DerivedRow label="30d Low" value={hist ? `${fmtCredits(hist.priceLow)} cr` : '—'} formula="MIN(priceHistory[].avgPrice)" />
              <DerivedRow label="Days of Supply" value={hist?.daysOfSupply != null ? hist.daysOfSupply.toFixed(1) + ' days' : '—'} formula="totalQtyAvailable / avgQtySoldDaily" />
              <DerivedRow label="7d Avg Volume" value={hist ? fmtQty(hist.vol7dAvg) : '—'} formula="AVG(qtySold) over last 7 days" />
              <DerivedRow label="30d Avg Volume" value={hist ? fmtQty(hist.vol30dAvg) : '—'} formula="AVG(qtySold) over 30 days" />
              <DerivedRow
                label="Volume Momentum"
                value={hist ? fmtPct(hist.volMomentum) : '—'}
                formula="(vol7dAvg − vol30dAvg) / vol30dAvg"
                color={hist ? (hist.volMomentum >= 0 ? 'var(--green)' : 'var(--red)') : undefined}
              />
              <DerivedRow label="7d Avg Daily Revenue" value={hist ? `${fmtCreditsExact(hist.dailyRevenue)} cr/day` : '—'} formula="AVG(avgPrice × qtySold) / 100 over 7 days" />
              <DerivedRow label="qtyC / qtySold ratio" value={hist?.qtyCRatio != null ? fmtPct(hist.qtyCRatio * 100, 0) : '—'} formula="AVG(qtyC/qtySold) per day — interpretation unclear" />
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  section: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    boxShadow: 'var(--card-shadow)',
  },
  sectionTitle: {
    padding: '14px 16px 4px',
    fontSize: 13, fontWeight: 600, letterSpacing: '-.01em',
  },
  sectionDesc: {
    padding: '2px 16px 12px',
    fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
  },
  tableScroll: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  th: {
    padding: '8px 14px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    borderBottom: '1px solid var(--border)',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg3)',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
  },
  td: {
    padding: '8px 14px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)',
    verticalAlign: 'top',
    lineHeight: 1.5,
    fontSize: 12,
  },
  tdField: {
    padding: '8px 14px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  },
  tdMono: {
    fontFamily: 'Space Mono, monospace',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },
  code: {
    fontFamily: 'Space Mono, monospace',
    fontSize: 11,
    color: 'var(--accent)',
    background: 'var(--accent-faint)',
    padding: '1px 5px',
    borderRadius: 4,
  },
  groupHeader: {
    padding: '10px 14px 6px',
    fontWeight: 600,
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    background: 'var(--bg3)',
    borderBottom: '1px solid var(--border)',
    borderTop: '1px solid var(--border)',
  },
}
