import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'

function shortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function fmtQty(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipDate}>{label}</div>
      <div style={styles.tooltipRow}>
        <span style={styles.tooltipDot} />
        <span>Volume</span>
        <span className="num" style={styles.tooltipVal}>
          {fmtQty(payload[0].value)}
        </span>
      </div>
    </div>
  )
}

export default function VolumeChart({ history, avgQty }) {
  if (!history || history.length === 0) {
    return <div style={styles.empty}>No volume data available</div>
  }

  const data = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(h => ({
      date: shortDate(h.date),
      qtySold: h.qtySold,
    }))

  const maxQty = Math.max(...data.map(d => d.qtySold))

  return (
    <div style={styles.wrap}>
      <div style={styles.chartTitle}>Daily Volume (30 days)</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
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
            tickFormatter={fmtQty}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="qtySold" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.qtySold === maxQty ? '#6366f1' : '#334155'}
                fillOpacity={entry.qtySold === maxQty ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
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
    padding: '30px 16px',
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
    borderRadius: 2,
    background: '#6366f1',
    flexShrink: 0,
  },
  tooltipVal: {
    marginLeft: 'auto',
    paddingLeft: 16,
    fontWeight: 700,
  },
}
