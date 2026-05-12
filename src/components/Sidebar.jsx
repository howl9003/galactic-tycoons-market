import { useState, useMemo } from 'react'
import { fmtCredits, fmtPct } from '../lib/format.js'

const SORT_OPTIONS = [
  { value: 'name-asc',    label: 'Name A–Z' },
  { value: 'name-desc',   label: 'Name Z–A' },
  { value: 'price-desc',  label: 'Price ↓' },
  { value: 'price-asc',   label: 'Price ↑' },
  { value: 'change-desc', label: '% Change ↓' },
  { value: 'change-asc',  label: '% Change ↑' },
]

function pct(m) {
  if (!m.avgPrice || m.avgPrice <= 0) return null
  return ((m.currentPrice - m.avgPrice) / m.avgPrice) * 100
}

export default function Sidebar({ materials, selected, onSelect, loading }) {
  const [search, setSearch] = useState('')
  const [sort,   setSort]   = useState('name-asc')

  const filtered = useMemo(() => {
    const q    = search.toLowerCase()
    let list   = materials.filter(m => m.matName.toLowerCase().includes(q))

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'name-asc':    return a.matName.localeCompare(b.matName)
        case 'name-desc':   return b.matName.localeCompare(a.matName)
        case 'price-desc':  return b.currentPrice - a.currentPrice
        case 'price-asc':   return a.currentPrice - b.currentPrice
        case 'change-desc': return (pct(b) ?? -Infinity) - (pct(a) ?? -Infinity)
        case 'change-asc':  return (pct(a) ?? Infinity)  - (pct(b) ?? Infinity)
        default: return 0
      }
    })
  }, [materials, search, sort])

  return (
    <aside style={styles.aside}>
      <div style={styles.header}>
        <span style={styles.title}>Materials</span>
        <span style={styles.count} className="num">{materials.length}</span>
      </div>

      <div style={styles.controls}>
        <input
          style={styles.search}
          type="search"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={styles.select}
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={styles.list}>
        {loading && materials.length === 0 && (
          <div style={styles.empty}>🍄 Loading…</div>
        )}

        {filtered.map(m => {
          const change    = pct(m)
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
                  {fmtCredits(m.currentPrice)} cr
                </span>
                {change !== null && (
                  <span
                    className="num"
                    style={{
                      ...styles.matChange,
                      color: change >= 0 ? 'var(--green)' : 'var(--red)',
                    }}
                  >
                    {fmtPct(change, 1)}
                  </span>
                )}
              </div>
            </button>
          )
        })}

        {!loading && filtered.length === 0 && (
          <div style={styles.empty}>No results for "{search}"</div>
        )}
      </div>
    </aside>
  )
}

const styles = {
  aside: {
    width: 264,
    minWidth: 264,
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
    fontSize: 14,
    letterSpacing: '-.01em',
  },
  count: {
    fontSize: 11,
    color: 'var(--text-muted)',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    padding: '1px 7px',
    borderRadius: 99,
  },
  controls: {
    padding: '0 10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  search: {
    padding: '7px 10px',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
  },
  select: {
    padding: '6px 8px',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: 12,
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    cursor: 'pointer',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 8,
  },
  item: {
    width: '100%',
    padding: '8px 14px',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 13,
    transition: 'background .1s',
  },
  itemActive: {
    background: 'var(--accent-faint)',
    borderLeft: '3px solid var(--accent)',
    paddingLeft: 11,
  },
  matName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 450,
  },
  matRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 1,
    flexShrink: 0,
  },
  matPrice: {
    fontSize: 11,
    color: 'var(--text)',
  },
  matChange: {
    fontSize: 10,
  },
  empty: {
    padding: '24px 16px',
    color: 'var(--text-muted)',
    fontSize: 13,
    textAlign: 'center',
  },
}
