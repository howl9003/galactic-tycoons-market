import { useState, useMemo } from 'react'
import { fmtCreditsExact, fmtQty, fmtCreditsRaw } from '../lib/format.js'

function aggregateLevels(orders) {
  const map = new Map()
  for (const o of orders) {
    const key = o.unitPrice
    if (!map.has(key)) map.set(key, { unitPrice: key, qty: 0, value: 0, sellers: new Set() })
    const lvl = map.get(key)
    lvl.qty   += o.qty
    lvl.value += o.unitPrice * o.qty
    lvl.sellers.add(o.cId ?? o.company_id ?? o.cName ?? o.company_name)
  }
  return [...map.values()]
    .sort((a, b) => a.unitPrice - b.unitPrice)
    .map(lvl => ({ ...lvl, sellerCount: lvl.sellers.size }))
}

export default function OrderBook({ orders }) {
  const [view, setView] = useState('aggregated') // 'aggregated' | 'individual'

  const sorted = useMemo(() =>
    orders ? [...orders].sort((a, b) => (a.unitPrice ?? a.unit_price) - (b.unitPrice ?? b.unit_price)) : []
  , [orders])

  const levels = useMemo(() => aggregateLevels(sorted), [sorted])

  const totalQty = useMemo(
    () => sorted.reduce((s, o) => s + (o.qty), 0),
    [sorted]
  )

  if (!orders || sorted.length === 0) {
    return (
      <div style={styles.wrap}>
        <div style={styles.header}><span style={styles.title}>Order Book</span></div>
        <div style={styles.empty}>No open orders</div>
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.title}>
          Order Book
          <span style={styles.badge} className="num">
            {sorted.length} orders · {levels.length} levels
          </span>
        </span>
        <div style={styles.toggle}>
          {['aggregated', 'individual'].map(v => (
            <button
              key={v}
              style={{ ...styles.toggleBtn, ...(view === v ? styles.toggleBtnActive : {}) }}
              onClick={() => setView(v)}
            >
              {v === 'aggregated' ? 'Levels' : 'All Orders'}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.tableWrap}>
        {view === 'aggregated' ? (
          <AggregatedView levels={levels} totalQty={totalQty} />
        ) : (
          <IndividualView orders={sorted} totalQty={totalQty} />
        )}
      </div>
    </div>
  )
}

function AggregatedView({ levels, totalQty }) {
  let cumQty = 0
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={{ ...styles.th, textAlign: 'right' }}>Price (cr)</th>
          <th style={{ ...styles.th, textAlign: 'right' }}>Qty at Level</th>
          <th style={{ ...styles.th, textAlign: 'right' }}>Value (cr)</th>
          <th style={{ ...styles.th, textAlign: 'right' }}>Sellers</th>
          <th style={{ ...styles.th, textAlign: 'right' }}>Cum. %</th>
          <th style={styles.th}></th>
        </tr>
      </thead>
      <tbody>
        {levels.map((lvl, i) => {
          cumQty += lvl.qty
          const cumPct = totalQty > 0 ? (cumQty / totalQty) * 100 : 0
          const isFirst = i === 0
          return (
            <tr key={lvl.unitPrice} style={{ background: isFirst ? 'var(--accent-faint)' : 'transparent' }}>
              <td style={{ ...styles.td, ...styles.tdNum, color: isFirst ? 'var(--accent)' : 'var(--text)', fontWeight: isFirst ? 700 : 400 }}>
                {fmtCreditsExact(lvl.unitPrice)}
              </td>
              <td style={{ ...styles.td, ...styles.tdNum }}>{fmtQty(lvl.qty)}</td>
              <td style={{ ...styles.td, ...styles.tdNum, color: 'var(--text-muted)' }}>
                {fmtCreditsRaw(lvl.value / 100)}
              </td>
              <td style={{ ...styles.td, ...styles.tdNum }}>{lvl.sellerCount}</td>
              <td style={{ ...styles.td, ...styles.tdNum, color: 'var(--text-muted)' }}>
                {cumPct.toFixed(1)}%
              </td>
              <td style={styles.td}>
                <div style={styles.bar}>
                  <div style={{ ...styles.barFill, width: `${cumPct}%` }} />
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function IndividualView({ orders, totalQty }) {
  let cumQty = 0
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={{ ...styles.th, textAlign: 'left' }}>Company</th>
          <th style={{ ...styles.th, textAlign: 'right' }}>Price (cr)</th>
          <th style={{ ...styles.th, textAlign: 'right' }}>Qty</th>
          <th style={{ ...styles.th, textAlign: 'right' }}>Value (cr)</th>
          <th style={styles.th}></th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o, i) => {
          const price = o.unitPrice ?? o.unit_price
          const name  = o.cName ?? o.company_name
          cumQty += o.qty
          const cumPct = totalQty > 0 ? (cumQty / totalQty) * 100 : 0
          const isFirst = i === 0
          return (
            <tr key={o.id ?? o.order_id ?? i} style={{ background: i % 2 === 1 ? 'var(--bg3)' : 'transparent' }}>
              <td style={styles.td}>
                <span style={{ ...styles.company, ...(isFirst ? { color: 'var(--accent)', fontWeight: 600 } : {}) }}>
                  {name}
                </span>
              </td>
              <td style={{ ...styles.td, ...styles.tdNum, color: isFirst ? 'var(--accent)' : 'var(--text)' }}>
                {fmtCreditsExact(price)}
              </td>
              <td style={{ ...styles.td, ...styles.tdNum }}>{fmtQty(o.qty)}</td>
              <td style={{ ...styles.td, ...styles.tdNum, color: 'var(--text-muted)' }}>
                {fmtCreditsRaw(price * o.qty / 100)}
              </td>
              <td style={styles.td}>
                <div style={styles.bar}>
                  <div style={{ ...styles.barFill, width: `${cumPct}%` }} />
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    boxShadow: 'var(--card-shadow)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexShrink: 0,
  },
  title: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.05em',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  badge: {
    fontWeight: 400, fontSize: 11, color: 'var(--text-muted)',
    background: 'var(--bg3)', border: '1px solid var(--border)',
    padding: '1px 7px', borderRadius: 99,
  },
  toggle: {
    display: 'flex',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  toggleBtn: {
    padding: '4px 10px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
  },
  toggleBtnActive: {
    background: 'var(--accent)',
    color: '#fff',
  },
  tableWrap: {
    overflowY: 'auto',
    maxHeight: 480,
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  th: {
    padding: '7px 12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg3)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '7px 12px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)',
    verticalAlign: 'middle',
  },
  tdNum: {
    fontFamily: 'Space Mono, monospace',
    textAlign: 'right',
    fontSize: 11,
  },
  company: {
    maxWidth: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  bar: {
    height: 5,
    background: 'var(--bg3)',
    borderRadius: 3,
    overflow: 'hidden',
    width: 64,
  },
  barFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: 3,
    opacity: 0.5,
  },
  empty: {
    padding: '32px 16px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: 13,
  },
}
