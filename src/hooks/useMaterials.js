import { useState, useEffect, useCallback } from 'react'

export function useMaterials() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/public/exchange/mat-prices')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMaterials(data.prices.filter(m => m.currentPrice !== -1))
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 60_000)
    return () => clearInterval(interval)
  }, [fetch_])

  return { materials, loading, error, lastUpdated, refresh: fetch_ }
}
