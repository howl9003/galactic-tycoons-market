import { useState, useEffect, useCallback } from 'react'

function useDbFetch(url, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const fetch_ = useCallback(async () => {
    if (!url) return
    setLoading(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])

  useEffect(() => {
    fetch_()
    const id = setInterval(fetch_, 60_000)
    return () => clearInterval(id)
  }, [fetch_])

  return { data, loading, error, refresh: fetch_ }
}

export function useSnapshots(matId, limit = 60) {
  return useDbFetch(matId ? `/db/snapshots/${matId}?limit=${limit}` : null, [matId, limit])
}

export function useSnapshotOrders(snapshotId) {
  return useDbFetch(snapshotId ? `/db/snapshot/${snapshotId}/orders` : null, [snapshotId])
}

export function useDbPriceHistory(matId, hours = 24) {
  return useDbFetch(matId ? `/db/price-history/${matId}?hours=${hours}` : null, [matId, hours])
}

export function useOrderChanges(matId, hours = 1) {
  return useDbFetch(matId ? `/db/order-changes/${matId}?hours=${hours}` : null, [matId, hours])
}

export function useDbStats() {
  return useDbFetch('/db/stats')
}
