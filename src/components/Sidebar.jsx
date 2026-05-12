import { useState, useMemo } from 'react'

const SORT_OPTIONS = [
  { value: 'name-asc',   label: 'Name A–Z' },
  { value: 'name-desc',  label: 'Name Z–A' },
  { value: 'price-desc', label: 'Price ↓' },
  { value: 'price-asc',  label: 'Price ↑' },
  { value: 'change-desc',label: '% Change ↓' },
  { value: 'change-asc', label: '% Change ↑' },
]

function pct(current, avg) {
  if (!avg || avg <= 0) return null
  return ((current - avg) / avg) * 100
}

export default function Sidebar({ materials, selected, onSelect, loading }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name-asc')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = materials.filter(m => m.matName.toLowerCase().includes(q))

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'name-asc':   return a.matName.localeCompare(b.matName)
        case 'name-desc':  return b.matName.localeCompare(a.matName)
        case 'price-desc': return b.currentPrice - a.currentPrice
        case 'price-asc':  return a.currentPrice - b.currentPrice
        case 'change-desc': return (pct(b.currentPrice, b.avgPrice) ?? -Infinity) - (pct(a.currentPrice, a.avgPrice) ?? -Infinity)
        case 'change-asc':  return (pct(a.currentPrice, a.avgPrice) ?? Infinity) - (pct(b.currentPrice, b.avgPrice) ?? Infinity)
        default: return 0
      }
    })
    return list
  }, [materials, search, sort])

  return (
    <aside style={styles.aside}>
      <div style={styles.header}>
        <span style={styles.title}>Materials</span>
        <span style={styles.count} className="num">{materials.length}</span>
      </div>

      <input
        style={styles.search}
        type="search"
        placeholder="Search…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <select style={styles.select} value={sort} onChange={e => setSort(e.target.value)}>
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <div style={styles.list}>
        {loading && materials.length === 0 && (
          <div style={styles.empty}>Loading…</div>
        )}
        {filtered.map(m => {
          const change = pct(m.currentPrice, m.avgPrice)
          const isSelected = selected?.matId === m.matId
          return (
            <button
              key={m.matId}
              style={{ ...styles.item, ...(isSelected ? styles.itemActive : {}) }}
              onClick={() => onSelect(m)}
            >
              <span style={styles.matName}>{m.matName}</span>
              <div style={styles.matRight}>
                <span className="num" style={styles.matPrice}>
                  {(m.currentPrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {change !== null && (
                  <span className="num" style={{ ...styles.matChange, color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
        {!loading && filtered.length === 0 && (
          <div style={styles.empty}>No results</div>
        )}
      </div>
    </aside>
  )
}

const styles = {
  aside: {
    width: 260,
    minWidth: 260,
    background: 'var(--bg2)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 16px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: '-.01em',
  },
  count: {
    fontSize: 12,
    color: 'var(--text-muted)',
    background: 'var(--bg3)',
    padding: '1px 7px',
    borderRadius: 99,
  },
  search: {
    margin: '0 10px 6px',
    padding: '7px 10px',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    width: 'calc(100% - 20px)',
  },
  select: {
    margin: '0 10px 8px',
    padding: '6px 8px',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 12,
    outline: 'none',
    fontFamily: 'inherit',
    width: 'calc(100% - 20px)',
    cursor: 'pointer',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 8,
  },
  item: {
    width: '100%',
    padding: '9px 14px',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    textAlign: 'left',
    transition: 'background .1s',
    fontSize: 13,
  },
  itemActive: {
    background: 'var(--bg3)',
    borderLeft: '3px solid var(--accent)',
    paddingLeft: 11,
  },
  matName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  matRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 1,
    flexShrink: 0,
  },
  matPrice: {
    fontSize: 12,
    color: 'var(--text)',
  },
  matChange: {
    fontSize: 11,
  },
  empty: {
    padding: '20px 16px',
    color: 'var(--text-muted)',
    fontSize: 13,
    textAlign: 'center',
  },
}
