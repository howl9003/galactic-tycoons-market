// ─── Number formatters ────────────────────────────────────────────────────────

/** Cents → display credits, auto-scaled (42.50, 1.23K, 4.56M) */
export function fmtCredits(cents) {
  if (cents == null || cents < 0) return '—'
  const val = cents / 100
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + 'B'
  if (val >= 1_000_000)     return (val / 1_000_000).toFixed(2) + 'M'
  if (val >= 1_000)         return (val / 1_000).toFixed(2) + 'K'
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Cents → exact credits string with 2 decimal places */
export function fmtCreditsExact(cents) {
  if (cents == null) return '—'
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Raw credits (not cents) → scaled string */
export function fmtCreditsRaw(val) {
  if (val == null || val < 0) return '—'
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + 'B'
  if (val >= 1_000_000)     return (val / 1_000_000).toFixed(2) + 'M'
  if (val >= 1_000)         return (val / 1_000).toFixed(2) + 'K'
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Integer quantity → scaled string */
export function fmtQty(n) {
  if (n == null || n < 0) return '—'
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

/** Percent with sign (+1.23%, -4.56%) */
export function fmtPct(n, decimals = 2) {
  if (n == null) return '—'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(decimals)}%`
}

/** ISO date string → "May 12" */
export function shortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** ISO/unix-ms → "May 12 14:23" */
export function fmtDatetime(ts) {
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  )
}

/** Relative time: "3m ago", "2h ago", "just now" */
export function relativeTime(ts) {
  const d = typeof ts === 'number' ? ts : new Date(ts).getTime()
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 5)    return 'just now'
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}
