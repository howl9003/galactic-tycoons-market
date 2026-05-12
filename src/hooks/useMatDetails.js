import { useState, useEffect, useCallback, useRef } from 'react'

async function ingestToDb(data) {
  // Fire-and-forget — silently ignored if the DB server isn't running
  try {
    await fetch('/db/ingest', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
  } catch (_) {
    // Server offline or unreachable — not a problem, just means no history saved
  }
}

const REFRESH_MS = 2 * 60 * 1000   // 2 minutes — individual mat details

export function useMatDetails(matId) {
  const [details,     setDetails]     = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [rateLimited, setRateLimited] = useState(false)
  const retryTimer = useRef(null)

  const fetch_ = useCallback(async () => {
    if (!matId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/public/exchange/mat-details/${matId}`)

      if (res.status === 429) {
        const after = parseInt(res.headers.get('retry-after') ?? '60')
        setRateLimited(true)
        setError(`Rate limited — retrying in ${after}s`)
        retryTimer.current = setTimeout(fetch_, after * 1_000)
        return
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      setDetails(data)
      setError(null)
      setRateLimited(false)

      // Pass the fresh data to the local DB server (browser → server, no firewall issue)
      ingestToDb(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [matId])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, REFRESH_MS)
    return () => {
      clearInterval(interval)
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [fetch_])

  return { details, loading, error, rateLimited, refresh: fetch_ }
}
