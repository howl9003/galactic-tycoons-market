import { useState, useEffect, useCallback, useRef } from 'react'

const REFRESH_MS = 5 * 60 * 1000   // 5 minutes — price list doesn't change that fast

export function useMaterials() {
  const [materials,    setMaterials]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [rateLimited,  setRateLimited]  = useState(false)
  const [lastUpdated,  setLastUpdated]  = useState(null)
  const retryTimer = useRef(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/public/exchange/mat-prices')

      if (res.status === 429) {
        const after = parseInt(res.headers.get('retry-after') ?? '60')
        setRateLimited(true)
        setError(`Rate limited — retrying in ${after}s`)
        retryTimer.current = setTimeout(fetch_, after * 1_000)
        return
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      setMaterials(data.prices.filter(m => m.currentPrice !== -1))
      setLastUpdated(new Date())
      setError(null)
      setRateLimited(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, REFRESH_MS)
    return () => {
      clearInterval(interval)
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [fetch_])

  return { materials, loading, error, rateLimited, lastUpdated, refresh: fetch_ }
}
