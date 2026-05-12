import { Router } from 'express'
import { stmts } from '../db.js'

const router = Router()

// GET /db/snapshots/:matId?limit=60
// Returns recent snapshots, most-recent first
router.get('/snapshots/:matId', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? 60), 1440)
    const rows  = stmts.getSnapshots.all(req.params.matId, limit)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /db/snapshot/:id/orders
// Returns all orders for one snapshot
router.get('/snapshot/:id/orders', (req, res) => {
  try {
    const rows = stmts.getSnapshotOrders.all(req.params.id)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /db/price-history/:matId?hours=24
// Returns snapshots within the last N hours for minute-level charting
router.get('/price-history/:matId', (req, res) => {
  try {
    const hours  = Math.min(parseInt(req.query.hours ?? 24), 180 * 24)
    const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString()
    const rows   = stmts.getPriceHistory.all(req.params.matId, cutoff)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /db/order-changes/:matId?hours=1
// Diffs first vs last snapshot in window to find new/removed orders
router.get('/order-changes/:matId', (req, res) => {
  try {
    const hours   = Math.min(parseInt(req.query.hours ?? 1), 180 * 24)
    const cutoff  = new Date(Date.now() - hours * 3_600_000).toISOString()
    const snaps   = stmts.getPriceHistory.all(req.params.matId, cutoff)

    if (snaps.length < 2) {
      return res.json({ snapshots: snaps.length, added: [], removedCount: 0 })
    }

    const firstOrders = new Set(
      stmts.getSnapshotOrders.all(snaps[0].id).map(o => o.order_id)
    )
    const lastOrders  = stmts.getSnapshotOrders.all(snaps[snaps.length - 1].id)

    const added        = lastOrders.filter(o => !firstOrders.has(o.order_id))
    const removedCount = [...firstOrders].filter(
      id => !lastOrders.find(o => o.order_id === id)
    ).length

    res.json({ snapshots: snaps.length, added, removedCount })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /db/stats
// Global database stats
router.get('/stats', (req, res) => {
  try {
    res.json(stmts.dbStats.get())
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
