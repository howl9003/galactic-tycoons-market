export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button style={styles.btn} onClick={onToggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}

const styles = {
  btn: {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 16,
    lineHeight: 1,
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    transition: 'background .15s',
  },
}
