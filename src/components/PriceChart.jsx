import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

function shortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function fmtPrice(cents) {
  const val = cents / 100
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M'
  if (val >= 1_000) return (val / 1_000).toFixed(1) + 'K'
  return val.toFixed(2)
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipDate}>{label}</div>
      <div style={styles.tooltipRow}>
        <span style={styles.tooltipDot} />
        <span>Avg Price</span>
        <span className="num" style={styles.tooltipVal}>
          {fmtPrice(payload[0].value)} cr
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
    .map(h => ({
      date: shortDate(h.date),
      avgPrice: h.avgPrice,
    }))

  const avgLine = avgPrice && avgPrice > 0 ? avgPrice : null

  return (
    <div style={styles.wrap}>
      <div style={styles.chartTitle}>Price History (30 days)</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'DM Sans' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Space Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtPrice}
            width={64}
          />
          <Tooltip content={<CustomTooltip />} />
          {avgLine && (
            <ReferenceLine
              y={avgLine}
              stroke="var(--text-muted)"
              strokeDasharray="4 4"
              label={{ value: 'avg', fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'DM Sans' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="avgPrice"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
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
    borderRadius: 12,
    padding: '16px',
    boxShadow: 'var(--card-shadow)',
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
  },
  empty: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '40px 16px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: 13,
  },
  tooltip: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
  },
  tooltipDate: {
    color: 'var(--text-muted)',
    fontSize: 11,
    marginBottom: 6,
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#6366f1',
    flexShrink: 0,
  },
  tooltipVal: {
    marginLeft: 'auto',
    paddingLeft: 16,
    fontWeight: 700,
  },
}
