import { useState, useEffect } from 'react'
import { useMaterials } from './hooks/useMaterials'
import { useMatDetails } from './hooks/useMatDetails'
import Sidebar from './components/Sidebar'
import StatCards from './components/StatCards'
import PriceChart from './components/PriceChart'
import VolumeChart from './components/VolumeChart'
import OrderBook from './components/OrderBook'
import ThemeToggle from './components/ThemeToggle'

function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gt-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gt-theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  return { theme, toggle }
}

function Spinner() {
  return (
    <div style={styles.spinner}>
      <div style={styles.spinnerRing} />
    </div>
  )
}

function RefreshBadge({ lastUpdated, onRefresh }) {
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      if (!lastUpdated) return
      setSecs(Math.round((Date.now() - lastUpdated.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [lastUpdated])

  return (
    <div style={styles.refreshBadge}>
      <span style={styles.refreshDot} />
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
        {lastUpdated ? `${secs}s ago` : 'Loading…'}
      </span>
      <button style={styles.refreshBtn} onClick={onRefresh}>↻</button>
    </div>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  const { materials, loading, error, lastUpdated, refresh } = useMaterials()
  const [selected, setSelected] = useState(null)

  const matId = selected?.matId ?? null
  const { details, loading: detailLoading } = useMatDetails(matId)

  useEffect(() => {
    if (!selected && materials.length > 0) {
      setSelected(materials[0])
    }
  }, [materials, selected])

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <Sidebar
        materials={materials}
        selected={selected}
        onSelect={setSelected}
        loading={loading}
      />

      {/* Main */}
      <div style={styles.main}>
        {/* Topbar */}
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <span style={styles.logo}>⬡ Galactic Tycoons</span>
            <span style={styles.topbarSub}>Market Exchange</span>
          </div>
          <div style={styles.topbarRight}>
            {error && <span style={styles.errorBadge}>API Error: {error}</span>}
            <RefreshBadge lastUpdated={lastUpdated} onRefresh={refresh} />
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        </header>

        {/* Content */}
        <div style={styles.content}>
          {!selected ? (
            <div style={styles.empty}>Select a material to view market data</div>
          ) : (
            <>
              {/* Material heading */}
              <div style={styles.matHeader}>
                <div>
                  <h1 style={styles.matTitle}>{selected.matName}</h1>
                  <div style={styles.matId} className="num">ID #{selected.matId}</div>
                </div>
                {detailLoading && <Spinner />}
              </div>

              {/* Stat cards */}
              <StatCards details={details} matName={selected.matName} />

              {/* Charts row */}
              <div style={styles.chartsRow}>
                <div style={styles.chartPrimary}>
                  <PriceChart
                    history={details?.priceHistory}
                    avgPrice={details?.avgPrice}
                  />
                </div>
                <div style={styles.chartSecondary}>
                  <VolumeChart
                    history={details?.priceHistory}
                    avgQty={details?.avgQtySoldDaily}
                  />
                </div>
              </div>

              {/* Order book */}
              <OrderBook orders={details?.orders} />
            </>
          )}
        </div>
      </div>

      <style>{spinnerStyle}</style>
    </div>
  )
}

const spinnerStyle = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
    gap: 12,
    flexShrink: 0,
  },
  topbarLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
  },
  logo: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '-.02em',
    color: 'var(--accent)',
  },
  topbarSub: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontWeight: 400,
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  errorBadge: {
    fontSize: 12,
    color: 'var(--red)',
    background: 'rgba(239,68,68,.12)',
    padding: '3px 10px',
    borderRadius: 99,
    border: '1px solid rgba(239,68,68,.3)',
  },
  refreshBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '4px 8px 4px 10px',
  },
  refreshDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--green)',
    flexShrink: 0,
  },
  refreshBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 16,
    padding: '0 2px',
    lineHeight: 1,
    cursor: 'pointer',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  matHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  matTitle: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-.03em',
    lineHeight: 1.1,
  },
  matId: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 3,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  chartPrimary: {},
  chartSecondary: {},
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: 15,
  },
  spinner: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  spinnerRing: {
    width: '100%',
    height: '100%',
    border: '2px solid var(--border)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin .7s linear infinite',
  },
}
