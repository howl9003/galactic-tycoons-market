// ─── Pure metric calculations from raw GT API data ───────────────────────────

/**
 * Level 2 order-book analysis.
 * @param {Array} orders  – raw orders from mat-details: [{id,cId,cName,unitPrice,qty}]
 * @returns metrics object or null
 */
export function calcL2Metrics(orders) {
  if (!orders || orders.length === 0) return null

  // ── Aggregate by price level ─────────────────────────────────────────────
  const levelMap = new Map()
  for (const o of orders) {
    if (!levelMap.has(o.unitPrice)) {
      levelMap.set(o.unitPrice, { unitPrice: o.unitPrice, qty: 0, sellers: new Set(), orders: [] })
    }
    const lvl = levelMap.get(o.unitPrice)
    lvl.qty += o.qty
    lvl.sellers.add(o.cId ?? o.company_id)
    lvl.orders.push(o)
  }

  const sortedLevels = [...levelMap.values()]
    .sort((a, b) => a.unitPrice - b.unitPrice)
    .map(lvl => ({ ...lvl, sellerCount: lvl.sellers.size }))

  // ── Aggregate totals ─────────────────────────────────────────────────────
  const totalSupply = orders.reduce((s, o) => s + o.qty, 0)
  // totalLiquidity in cents
  const totalLiquidity = orders.reduce((s, o) => s + o.unitPrice * o.qty, 0)
  const weightedAvgAsk = totalSupply > 0 ? totalLiquidity / totalSupply : 0

  const sellerCount    = new Set(orders.map(o => o.cId ?? o.company_id)).size
  const priceLevelCount = levelMap.size

  // ── Largest single order ─────────────────────────────────────────────────
  const largestOrder = orders.reduce(
    (best, o) => (o.qty > best.qty ? o : best),
    orders[0]
  )

  // ── Seller concentration (top-3 by total qty) ────────────────────────────
  const sellerQty = new Map()
  for (const o of orders) {
    const key = o.cId ?? o.company_id
    sellerQty.set(key, (sellerQty.get(key) ?? 0) + o.qty)
  }
  const top3Qty = [...sellerQty.values()]
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((s, q) => s + q, 0)
  const top3Concentration = totalSupply > 0 ? (top3Qty / totalSupply) * 100 : 0

  // ── Market depth at price thresholds ────────────────────────────────────
  const bestAsk = sortedLevels[0]?.unitPrice ?? 0
  const qtyWithin = (pctAbove) =>
    orders.filter(o => o.unitPrice <= bestAsk * (1 + pctAbove))
          .reduce((s, o) => s + o.qty, 0)

  const depth10pct = qtyWithin(0.10)
  const depth20pct = qtyWithin(0.20)
  const depth50pct = qtyWithin(0.50)

  // ── Cumulative depth curve (for DepthChart) ──────────────────────────────
  let cumQty   = 0
  let cumValue = 0
  const cumulativeDepthCurve = sortedLevels.map(lvl => {
    cumQty   += lvl.qty
    cumValue += lvl.unitPrice * lvl.qty
    return {
      price:          lvl.unitPrice,
      qtyAtLevel:     lvl.qty,
      cumulativeQty:  cumQty,
      cumulativeValue:cumValue,
      pctOfTotal:     totalSupply > 0 ? (cumQty / totalSupply) * 100 : 0,
    }
  })

  return {
    totalSupply,
    totalLiquidity,   // cents
    weightedAvgAsk,   // cents
    sellerCount,
    priceLevelCount,
    largestOrder,
    top3Concentration,
    depth10pct,
    depth20pct,
    depth50pct,
    bestAsk,          // cents
    sortedLevels,
    cumulativeDepthCurve,
  }
}

/**
 * Historical / time-series derived metrics.
 * @param {Array}  priceHistory       – from mat-details priceHistory
 * @param {number} totalQtyAvailable
 * @param {number} avgQtySoldDaily
 */
export function calcHistoryMetrics(priceHistory, totalQtyAvailable, avgQtySoldDaily) {
  if (!priceHistory || priceHistory.length === 0) return null

  const sorted = [...priceHistory].sort((a, b) => a.date.localeCompare(b.date))
  const prices = sorted.map(h => h.avgPrice).filter(p => p > 0)
  if (prices.length === 0) return null

  // ── Price stats ──────────────────────────────────────────────────────────
  const mean    = prices.reduce((s, p) => s + p, 0) / prices.length
  const variance= prices.reduce((s, p) => s + (p - mean) ** 2, 0) / prices.length
  const stddev  = Math.sqrt(variance)
  const volatility = mean > 0 ? stddev / mean : 0   // coefficient of variation

  const priceHigh = Math.max(...prices)
  const priceLow  = Math.min(...prices)

  // 30d % change (first → last)
  const change30d = sorted[0].avgPrice > 0
    ? ((sorted[sorted.length - 1].avgPrice - sorted[0].avgPrice) / sorted[0].avgPrice) * 100
    : null

  // ── Volume-weighted average price (VWAP) ────────────────────────────────
  const totalVol = sorted.reduce((s, h) => s + h.qtySold, 0)
  const vwap30d  = totalVol > 0
    ? sorted.reduce((s, h) => s + h.avgPrice * h.qtySold, 0) / totalVol
    : 0

  // ── Volume momentum (7d avg vs 30d avg) ─────────────────────────────────
  const recent7   = sorted.slice(-7)
  const vol7dAvg  = recent7.reduce((s, h) => s + h.qtySold, 0) / Math.max(recent7.length, 1)
  const vol30dAvg = totalVol / Math.max(sorted.length, 1)
  const volMomentum = vol30dAvg > 0 ? ((vol7dAvg - vol30dAvg) / vol30dAvg) * 100 : 0

  // ── Days of supply ───────────────────────────────────────────────────────
  const daysOfSupply = avgQtySoldDaily > 0 ? totalQtyAvailable / avgQtySoldDaily : null

  // ── Supply trend (last-7-day qtyRemaining slope) ─────────────────────────
  const recentQtyRem = sorted.slice(-7).map(h => h.qtyRemaining).filter(Boolean)
  const supplyTrend  = recentQtyRem.length >= 2
    ? recentQtyRem[recentQtyRem.length - 1] - recentQtyRem[0]
    : 0

  // ── Daily revenue (avg of last 7 days, in credits) ───────────────────────
  const dailyRevenue = recent7.reduce((s, h) => s + h.avgPrice * h.qtySold, 0) / (7 * 100)

  // ── qtyC analysis ────────────────────────────────────────────────────────
  // qtyC meaning is undocumented; empirically it tracks roughly 20-50% of qtySold
  const qtyCRatio = sorted.length > 0
    ? sorted.reduce((s, h) => s + (h.qtySold > 0 ? h.qtyC / h.qtySold : 0), 0) / sorted.length
    : null

  return {
    volatility,
    priceHigh,
    priceLow,
    change30d,
    vwap30d,       // cents
    vol7dAvg,
    vol30dAvg,
    volMomentum,
    daysOfSupply,
    supplyTrend,
    dailyRevenue,  // credits
    qtyCRatio,
    mean,          // cents
    stddev,        // cents
  }
}

/**
 * Simulate buying `targetQty` units by walking the order book.
 * Returns fill details including average cost.
 */
export function calcPriceImpact(orders, targetQty) {
  if (!orders || orders.length === 0 || targetQty <= 0) return null

  const sorted = [...orders].sort((a, b) => a.unitPrice - b.unitPrice)
  let remaining  = targetQty
  let totalCost  = 0
  let filled     = 0

  for (const order of sorted) {
    if (remaining <= 0) break
    const take = Math.min(remaining, order.qty)
    totalCost  += take * order.unitPrice
    filled     += take
    remaining  -= take
  }

  if (filled === 0) return null
  return {
    targetQty,
    filled,
    canFill:   remaining <= 0,
    avgPrice:  totalCost / filled,   // cents
    totalCost,                        // cents
    slippage:  sorted[0]?.unitPrice > 0
      ? ((totalCost / filled - sorted[0].unitPrice) / sorted[0].unitPrice) * 100
      : 0,
  }
}
