export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      style={styles.btn}
      onClick={onToggle}
      title={isDark ? 'Switch to Shroomberg (light)' : 'Switch to Moonlit Forest (dark)'}
    >
      <span style={styles.icon}>{isDark ? '☀️' : '🌙'}</span>
      <span style={styles.label}>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}

const styles = {
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px 10px',
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 500,
    transition: 'background .15s, color .15s',
  },
  icon:  { fontSize: 14, lineHeight: 1 },
  label: { letterSpacing: '-.01em' },
}
