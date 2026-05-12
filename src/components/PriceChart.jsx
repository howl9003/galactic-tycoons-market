import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts'
import { fmtCredits, shortDate } from '../lib/format.js'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltip}>
      <div style={styles.ttDate}>{label}</div>
      <div style={styles.ttRow}>
        <span style={styles.ttDot} />
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Avg Price</span>
        <span className="num" style={styles.ttVal}>
          {fmtCredits(payload[0].value)} cr
        </span>
      </div>
    </div>
  )
}

export default function PriceChart({ history, avgPrice }) {
  if (!history || history.length === 0) {
    return <div style={styles.empty}>No price history available</div>
  }

  const data = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(h => ({ date: shortDate(h.date), avgPrice: h.avgPrice }))

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>Price History · 30 days</div>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'DM Sans' }}
            axisLine={false} tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Space Mono' }}
            axisLine={false} tickLine={false}
            tickFormatter={fmtCredits}
            width={58}
          />
          <Tooltip content={<CustomTooltip />} />
          {avgPrice > 0 && (
            <ReferenceLine
              y={avgPrice}
              stroke="var(--text-muted)"
              strokeDasharray="4 4"
              label={{ value: 'avg', fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'DM Sans', position: 'insideRight' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="avgPrice"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
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
  },
  title: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12,
  },
  empty: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '48px 16px',
    textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
  },
  tooltip: {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 13px', fontSize: 13,
  },
  ttDate:  { color: 'var(--text-muted)', fontSize: 10, marginBottom: 5 },
  ttRow:   { display: 'flex', alignItems: 'center', gap: 6 },
  ttDot:   { width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 },
  ttVal:   { marginLeft: 'auto', paddingLeft: 16, fontWeight: 700 },
}
