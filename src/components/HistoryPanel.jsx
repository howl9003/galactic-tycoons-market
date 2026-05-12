import { useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { useSnapshots, useSnapshotOrders, useDbPriceHistory, useDbStats } from '../hooks/useOrderbookHistory.js'
import { fmtCredits, fmtCreditsExact, fmtQty, fmtDatetime, relativeTime } from '../lib/format.js'

const HOURS = [
  { label: '1h',   value: 1 },
  { label: '6h',   value: 6 },
  { label: '24h',  value: 24 },
  { label: '7d',   value: 168 },
  { label: '30d',  value: 720 },
  { label: '6mo',  value: 4320 },
]

function DbStatus() {
  const { data } = useDbStats()
  if (!data) return null
  return (
    <div style={statusStyles.wrap}>
      <span style={statusStyles.dot} />
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
        DB: {data.total_snapshots?.toLocaleString() ?? '—'} snapshots ·{' '}
        {data.tracked_materials ?? '—'} materials ·{' '}
        {data.oldest_snapshot
          ? `since ${fmtDatetime(data.oldest_snapshot)}`
          : 'no data yet'}
      </span>
    </div>
  )
}

function MiniOrderBook({ snapshotId }) {
  const { data, loading } = useSnapshotOrders(snapshotId)
  if (loading) return <div style={miniStyles.loading}>Loading orders…</div>
  if (!data || data.length === 0) return <div style={miniStyles.loading}>No orders in snapshot</div>
  const sorted = [...data].sort((a, b) => a.unit_price - b.unit_price)
  return (
    <div style={miniStyles.wrap}>
      <table style={miniStyles.table}>
        <thead>
          <tr>
            <th style={miniStyles.th}>Company</th>
            <th style={{ ...miniStyles.th, textAlign: 'right' }}>Price (cr)</th>
            <th style={{ ...miniStyles.th, textAlign: 'right' }}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((o, i) => (
            <tr key={i}>
              <td style={miniStyles.td}>{o.company_name}</td>
              <td style={{ ...miniStyles.td, fontFamily: 'Space Mono,monospace', fontSize: 11, textAlign: 'right' }}>
                {fmtCreditsExact(o.unit_price)}
              </td>
              <td style={{ ...miniStyles.td, fontFamily: 'Space Mono,monospace', fontSize: 11, textAlign: 'right' }}>
                {fmtQty(o.qty)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={ttStyles.wrap}>
      <div style={ttStyles.date}>{fmtDatetime(d.captured_at)}</div>
      <div style={ttStyles.row}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Price</span>
        <span className="num" style={ttStyles.val}>{fmtCredits(d.current_price)} cr</span>
      </div>
      <div style={ttStyles.row}>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Orders</span>
        <span className="num" style={ttStyles.val}>{d.order_count}</span>
      </div>
    </div>
  )
}

export default function HistoryPanel({ matId }) {
  const [hours, setHours]           = useState(24)
  const [expandedId, setExpandedId] = useState(null)

  const { data: priceHistory, loading: chartLoading } = useDbPriceHistory(matId, hours)
  const { data: snapshots,    loading: snapLoading  } = useSnapshots(matId, 120)

  const hasData = priceHistory && priceHistory.length > 0

  return (
    <div style={styles.wrap}>
      {/* DB status badge */}
      <DbStatus />

      {/* Minute-level price chart */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>Price History (from DB · minute resolution)</span>
          <div style={styles.hourBtns}>
            {HOURS.map(h => (
              <button
                key={h.value}
                style={{ ...styles.hourBtn, ...(hours === h.value ? styles.hourBtnActive : {}) }}
                onClick={() => setHours(h.value)}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {!hasData && !chartLoading && (
          <div style={styles.emptyChart}>
            🍄 No data collected yet — start the server and wait for the first poll.
          </div>
        )}

        {hasData && (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={priceHistory} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="captured_at"
                tickFormatter={v => fmtDatetime(v).split(' ')[1]}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'DM Sans' }}
                axisLine={false} tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Space Mono' }}
                axisLine={false} tickLine={false}
                tickFormatter={fmtCredits}
                width={56}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="current_price"
                stroke="var(--accent)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Snapshot browser */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>Snapshot Browser · click a row to view its order book</span>
          <span style={styles.cardSub} className="num">
            {snapshots ? `${snapshots.length} snapshots` : '—'}
          </span>
        </div>

        {!snapshots?.length && !snapLoading && (
          <div style={styles.emptyChart}>No snapshots saved yet.</div>
        )}

        {snapshots && snapshots.length > 0 && (
          <div style={styles.snapTableWrap}>
            <table style={styles.snapTable}>
              <thead>
                <tr>
                  <th style={styles.snapTh}>Time</th>
                  <th style={{ ...styles.snapTh, textAlign: 'right' }}>Price</th>
                  <th style={{ ...styles.snapTh, textAlign: 'right' }}>Supply</th>
                  <th style={{ ...styles.snapTh, textAlign: 'right' }}>Orders</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map(snap => {
                  const expanded = expandedId === snap.id
                  return [
                    <tr
                      key={snap.id}
                      style={{
                        ...styles.snapRow,
                        background: expanded ? 'var(--accent-faint)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpandedId(expanded ? null : snap.id)}
                    >
                      <td style={styles.snapTd}>
                        <span style={{ fontSize: 11 }}>{fmtDatetime(snap.captured_at)}</span>
                        <span style={styles.relTime}>{relativeTime(snap.captured_at)}</span>
                      </td>
                      <td style={{ ...styles.snapTd, ...styles.snapNum }}>{fmtCreditsExact(snap.current_price)} cr</td>
                      <td style={{ ...styles.snapTd, ...styles.snapNum }}>{fmtQty(snap.total_qty_available)}</td>
                      <td style={{ ...styles.snapTd, ...styles.snapNum }}>{snap.order_count}</td>
                    </tr>,
                    expanded && (
                      <tr key={`${snap.id}-orders`}>
                        <td colSpan={4} style={{ padding: 0, borderBottom: '1px solid var(--border)' }}>
                          <MiniOrderBook snapshotId={snap.id} />
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrap:  { display: 'flex', flexDirection: 'column', gap: 16 },
  card:  { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' },
  cardHeader: { padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  cardTitle: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' },
  cardSub:   { fontSize: 10, color: 'var(--text-muted)' },
  emptyChart: { padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 },
  hourBtns: { display: 'flex', gap: 3 },
  hourBtn: { padding: '3px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' },
  hourBtnActive: { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' },
  snapTableWrap: { overflowX: 'auto', maxHeight: 500, overflowY: 'auto' },
  snapTable: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  snapTh: { padding: '7px 14px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', position: 'sticky', top: 0 },
  snapRow: { borderBottom: '1px solid var(--border)', transition: 'background .1s' },
  snapTd: { padding: '7px 14px', verticalAlign: 'middle' },
  snapNum: { fontFamily: 'Space Mono, monospace', fontSize: 11, textAlign: 'right' },
  relTime: { marginLeft: 6, fontSize: 10, color: 'var(--text-muted)' },
}

const statusStyles = {
  wrap: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' },
  dot:  { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 },
}

const miniStyles = {
  wrap: { padding: '8px 0', background: 'var(--bg3)' },
  loading: { padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 11 },
  th: { padding: '5px 14px', fontWeight: 600, color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' },
  td: { padding: '4px 14px', borderBottom: '1px solid var(--border)', color: 'var(--text)' },
}

const ttStyles = {
  wrap: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 13px', fontSize: 12 },
  date: { color: 'var(--text-muted)', fontSize: 10, marginBottom: 5 },
  row:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  val:  { fontWeight: 700, fontSize: 11 },
}
