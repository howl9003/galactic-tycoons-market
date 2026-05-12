import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts'
import { fmtQty, shortDate } from '../lib/format.js'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={styles.tooltip}>
      <div style={styles.ttDate}>{label}</div>
      <div style={styles.ttRow}>
        <span style={styles.ttDot} />
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Volume</span>
        <span className="num" style={styles.ttVal}>{fmtQty(payload[0].value)}</span>
      </div>
    </div>
  )
}

export default function VolumeChart({ history }) {
  if (!history || history.length === 0) {
    return <div style={styles.empty}>No volume data</div>
  }

  const data = [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(h => ({ date: shortDate(h.date), qtySold: h.qtySold }))

  const maxQty = Math.max(...data.map(d => d.qtySold))

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>Daily Volume · 30 days</div>
      <ResponsiveContainer width="100%" height={168}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
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
            tickFormatter={fmtQty}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="qtySold" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.qtySold === maxQty ? 'var(--accent)' : 'var(--border)'}
                fillOpacity={entry.qtySold === maxQty ? 1 : 0.8}
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
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--card-shadow)',
  },
  title: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12,
  },
  empty: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '30px 16px',
    textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
  },
  tooltip: {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 13px', fontSize: 13,
  },
  ttDate:  { color: 'var(--text-muted)', fontSize: 10, marginBottom: 5 },
  ttRow:   { display: 'flex', alignItems: 'center', gap: 6 },
  ttDot:   { width: 8, height: 8, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 },
  ttVal:   { marginLeft: 'auto', paddingLeft: 16, fontWeight: 700 },
}
