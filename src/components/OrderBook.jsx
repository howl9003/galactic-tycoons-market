function fmtPrice(cents) {
  if (cents == null) return '—'
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtQty(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

export default function OrderBook({ orders }) {
  const sorted = orders ? [...orders].sort((a, b) => a.unitPrice - b.unitPrice) : []
  const maxQty = sorted.length ? Math.max(...sorted.map(o => o.qty)) : 1

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>Order Book</div>

      {sorted.length === 0 ? (
        <div style={styles.empty}>No open orders</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left' }}>Company</th>
                <th style={styles.th}>Price (cr)</th>
                <th style={styles.th}>Qty</th>
                <th style={{ ...styles.th, width: 80 }}>Depth</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((order, i) => {
                const depthPct = (order.qty / maxQty) * 100
                return (
                  <tr key={order.id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg3)' }}>
                    <td style={styles.td}>
                      <span style={styles.company}>{order.cName}</span>
                    </td>
                    <td style={{ ...styles.td, ...styles.tdNum }}>
                      {fmtPrice(order.unitPrice)}
                    </td>
                    <td style={{ ...styles.td, ...styles.tdNum }}>
                      {fmtQty(order.qty)}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.depthBar}>
                        <div
                          style={{
                            ...styles.depthFill,
                            width: `${depthPct}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: 'var(--card-shadow)',
  },
  title: {
    padding: '14px 16px 10px',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    borderBottom: '1px solid var(--border)',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    padding: '8px 14px',
    textAlign: 'right',
    fontWeight: 500,
    color: 'var(--text-muted)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg3)',
  },
  td: {
    padding: '8px 14px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)',
    verticalAlign: 'middle',
  },
  tdNum: {
    fontFamily: 'Space Mono, monospace',
    fontSize: 12,
    textAlign: 'right',
  },
  company: {
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  depthBar: {
    height: 6,
    background: 'var(--bg3)',
    borderRadius: 3,
    overflow: 'hidden',
    width: 70,
  },
  depthFill: {
    height: '100%',
    background: '#6366f1',
    borderRadius: 3,
    transition: 'width .3s',
  },
  empty: {
    padding: '24px 16px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: 13,
  },
}
