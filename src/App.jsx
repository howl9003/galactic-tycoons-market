import { useState, useEffect } from 'react'
import { useMaterials }    from './hooks/useMaterials.js'
import { useMatDetails }   from './hooks/useMatDetails.js'
import Sidebar             from './components/Sidebar.jsx'
import StatCards           from './components/StatCards.jsx'
import PriceChart          from './components/PriceChart.jsx'
import VolumeChart         from './components/VolumeChart.jsx'
import OrderBook           from './components/OrderBook.jsx'
import DepthChart          from './components/DepthChart.jsx'
import LiquidityPanel      from './components/LiquidityPanel.jsx'
import DataExplorer        from './components/DataExplorer.jsx'
import HistoryPanel        from './components/HistoryPanel.jsx'
import TabPanel            from './components/TabPanel.jsx'
import ShroomLogo          from './components/ShroomLogo.jsx'
import ThemeToggle         from './components/ThemeToggle.jsx'

// ── Theme ─────────────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('shroomberg-theme') ?? 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('shroomberg-theme', theme)
  }, [theme])
  return { theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }
}

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',       emoji: '📊' },
  { id: 'level2',    label: 'Level 2 Depth',  emoji: '📈' },
  { id: 'explorer',  label: 'Data Explorer',  emoji: '🔬' },
  { id: 'history',   label: 'DB History',     emoji: '🗄️' },
]

// ── Spinner ───────────────────────────────────────────────────────────────────
const spinKeyframe = `@keyframes shroomSpin { to { transform: rotate(360deg); } }`
function Spinner({ size = 18 }) {
  return (
    <>
      <style>{spinKeyframe}</style>
      <div style={{
        width: size, height: size,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'shroomSpin .7s linear infinite',
        flexShrink: 0,
      }} />
    </>
  )
}

// ── Live clock / refresh badge ────────────────────────────────────────────────
function RefreshBadge({ lastUpdated, onRefresh }) {
  const [, forceRender] = useState(0)
  useEffect(() => {
    const id = setInterval(() => forceRender(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const secs  = lastUpdated ? Math.round((Date.now() - lastUpdated.getTime()) / 1000) : null
  const nextIn = secs != null ? Math.max(0, 300 - secs) : '—'
  return (
    <div style={badge.wrap}>
      <span style={badge.dot} />
      <span className="refresh-text" style={badge.text}>
        {secs != null ? `updated ${secs}s ago · next in ${nextIn}s` : 'Loading…'}
      </span>
      <button style={badge.btn} onClick={onRefresh} title="Refresh now">↻</button>
    </div>
  )
}
const badge = {
  wrap: { display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px 4px 10px' },
  dot:  { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 },
  text: { fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  btn:  { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 15, padding: '0 2px', lineHeight: 1, cursor: 'pointer' },
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const { theme, toggle }                                        = useTheme()
  const { materials, loading, error, lastUpdated, refresh }      = useMaterials()
  const [selected, setSelected]                                  = useState(null)
  const [activeTab, setActiveTab]                                = useState('overview')
  const [sidebarOpen, setSidebarOpen]                            = useState(false)

  const matId = selected?.matId ?? null
  const { details, loading: detailLoading } = useMatDetails(matId)

  // Auto-select first material
  useEffect(() => {
    if (!selected && materials.length > 0) setSelected(materials[0])
  }, [materials, selected])

  function handleSelect(m) {
    setSelected(m)
    setActiveTab('overview')
    setSidebarOpen(false)   // close drawer on mobile after picking
  }

  return (
    <div style={s.root}>
      {/* ── Mobile sidebar overlay ── */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <Sidebar
        materials={materials}
        selected={selected}
        onSelect={handleSelect}
        loading={loading}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main panel ── */}
      <div style={s.main}>
        {/* Topbar */}
        <header className="topbar-pad" style={s.topbar}>
          <div style={s.topbarLeft}>
            {/* Hamburger — only visible on mobile via CSS */}
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Open materials list"
            >
              ☰
            </button>
            <ShroomLogo size={26} />
            <div>
              <div style={s.appName}>Shroomberg Terminal</div>
              <div className="app-sub" style={s.appSub}>Galactic Tycoons Exchange</div>
            </div>
          </div>

          <div style={s.topbarRight}>
            {error && (
              <span style={s.errorBadge}>⚠ {error}</span>
            )}
            <RefreshBadge lastUpdated={lastUpdated} onRefresh={refresh} />
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        </header>

        {/* Material heading + tab strip */}
        {selected && (
          <div style={s.matHeaderWrap}>
            <div className="mat-header-pad" style={s.matHeader}>
              <div>
                <h1 style={s.matTitle}>{selected.matName}</h1>
                <span style={s.matId} className="num">mat #{selected.matId}</span>
              </div>
              {detailLoading && <Spinner />}
            </div>
            <TabPanel tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        )}

        {/* Content */}
        <div className="content-area" style={s.content}>
          {!selected ? (
            <div style={s.welcome}>
              <ShroomLogo size={64} />
              <div style={s.welcomeTitle}>Welcome to Shroomberg Terminal</div>
              <div style={s.welcomeSub}>Select a material to begin analysis</div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div style={s.colStack}>
                  <StatCards details={details} />
                  <div className="charts-row">
                    <PriceChart history={details?.priceHistory} avgPrice={details?.avgPrice} />
                    <VolumeChart history={details?.priceHistory} />
                  </div>
                </div>
              )}

              {activeTab === 'level2' && (
                <div className="l2-layout">
                  <div style={s.l2Left}>
                    <OrderBook orders={details?.orders} />
                  </div>
                  <div style={s.l2Right}>
                    <DepthChart orders={details?.orders} />
                    <LiquidityPanel orders={details?.orders} />
                  </div>
                </div>
              )}

              {activeTab === 'explorer' && (
                <DataExplorer details={details} />
              )}

              {activeTab === 'history' && (
                <HistoryPanel matId={matId} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Layout styles ─────────────────────────────────────────────────────────────
const s = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden' },

  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },

  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
    gap: 12, flexShrink: 0,
  },
  topbarLeft:  { display: 'flex', alignItems: 'center', gap: 10 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 10 },
  appName: { fontSize: 15, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--text)' },
  appSub:  { fontSize: 10, color: 'var(--text-muted)', letterSpacing: '-.01em' },

  errorBadge: {
    fontSize: 11, color: 'var(--red)', background: 'var(--red-faint)',
    border: '1px solid var(--red)', padding: '3px 10px', borderRadius: 99,
    opacity: 0.8,
  },

  matHeaderWrap: {
    background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0,
  },
  matHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '14px 20px 10px', gap: 12,
  },
  matTitle: { fontSize: 22, fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1.1 },
  matId:    { fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'block' },

  content: {
    flex: 1, overflowY: 'auto', padding: 20,
    display: 'flex', flexDirection: 'column', gap: 14,
  },

  // Overview
  colStack: { display: 'flex', flexDirection: 'column', gap: 14 },

  // Level 2
  l2Left:   { display: 'flex', flexDirection: 'column', gap: 14 },
  l2Right:  { display: 'flex', flexDirection: 'column', gap: 14 },

  // Welcome
  welcome: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 14, color: 'var(--text-muted)',
  },
  welcomeTitle: { fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-.02em' },
  welcomeSub:   { fontSize: 13, textAlign: 'center', padding: '0 20px' },
}
