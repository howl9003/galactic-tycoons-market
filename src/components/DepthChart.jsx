import { useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'
import { fmtCredits, fmtQty, fmtCreditsRaw } from '../lib/format.js'
import { calcL2Metrics } from '../lib/metrics.js'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={styles.tooltip}>
      <div style={styles.ttRow}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Price</span>
        <span className="num" style={styles.ttVal}>{fmtCredits(d.price)} cr</span>
      </div>
      <div style={styles.ttRow}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>At this level</span>
        <span className="num" style={styles.ttVal}>{fmtQty(d.qtyAtLevel)}</span>
      </div>
      <div style={styles.ttRow}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Cumulative</span>
        <span className="num" style={styles.ttVal}>{fmtQty(d.cumulativeQty)}</span>
      </div>
      <div style={styles.ttRow}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Cum. value</span>
        <span className="num" style={styles.ttVal}>{fmtCreditsRaw(d.cumulativeValue / 100)} cr</span>
      </div>
      <div style={styles.ttRow}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>% filled</span>
        <span className="num" style={styles.ttVal}>{d.pctOfTotal.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export default function DepthChart({ orders }) {
  const metrics = useMemo(() => orders ? calcL2Metrics(orders) : null, [orders])

  if (!metrics || metrics.cumulativeDepthCurve.length === 0) {
    return <div style={styles.empty}>No depth data</div>
  }

  const curve     = metrics.cumulativeDepthCurve
  const bestAsk   = metrics.bestAsk
  const wall      = metrics.largestOrder
  const wallPrice = wall?.unitPrice ?? wall?.unit_price

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.title}>Market Depth (L2)</span>
        <span style={styles.sub} className="num">
          {metrics.priceLevelCount} levels · {fmtQty(metrics.totalSupply)} units total
        </span>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={curve} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="depthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--accent)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="price"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={v => fmtCredits(v)}
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Space Mono' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Space Mono' }}
            axisLine={false} tickLine={false}
            tickFormatter={fmtQty}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={bestAsk}
            stroke="var(--accent)"
            strokeDasharray="4 4"
            label={{ value: 'best ask', fill: 'var(--accent)', fontSize: 9, position: 'insideTopRight' }}
          />
          {wallPrice && wallPrice !== bestAsk && (
            <ReferenceLine
              x={wallPrice}
              stroke="var(--gold)"
              strokeDasharray="3 3"
              label={{ value: '🧱', fill: 'var(--gold)', fontSize: 11, position: 'insideTopLeft' }}
            />
          )}
          <Area
            type="stepAfter"
            dataKey="cumulativeQty"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#depthGrad)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    boxShadow: 'var(--card-shadow)',
  },
  header: {
    padding: '12px 16px 4px',
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
  },
  title: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.05em',
  },
  sub: {
    fontSize: 10, color: 'var(--text-muted)',
  },
  empty: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '48px 16px',
    textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
  },
  tooltip: {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 14px', fontSize: 12,
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  ttRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
  },
  ttVal: { fontWeight: 700, fontSize: 11 },
}
