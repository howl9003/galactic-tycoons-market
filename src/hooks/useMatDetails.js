import { useState, useEffect, useCallback } from 'react'

export function useMatDetails(matId) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch_ = useCallback(async () => {
    if (!matId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/public/exchange/mat-details/${matId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDetails(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [matId])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 60_000)
    return () => clearInterval(interval)
  }, [fetch_])

  return { details, loading, error, refresh: fetch_ }
}
