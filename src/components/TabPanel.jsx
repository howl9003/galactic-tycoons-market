export default function TabPanel({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tab-strip" style={styles.strip}>
      {tabs.map(tab => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.emoji && <span style={styles.emoji}>{tab.emoji}</span>}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

const styles = {
  strip: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 2,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg2)',
    flexShrink: 0,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '10px 14px 9px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-muted)',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '-.01em',
    cursor: 'pointer',
    transition: 'color .15s',
    marginBottom: -1,
  },
  tabActive: {
    color: 'var(--accent)',
    borderBottomColor: 'var(--accent)',
  },
  emoji: {
    fontSize: 14,
    lineHeight: 1,
  },
}
