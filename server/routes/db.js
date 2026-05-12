import { Router } from 'express'
import { stmts, insertSnapshotTx } from '../db.js'

const router = Router()

// ── Write ─────────────────────────────────────────────────────────────────────

// POST /db/ingest
// Called by the browser after every successful mat-details fetch.
// Body = raw GT API response: { matId, matName, currentPrice, orders, priceHistory, … }
router.post('/ingest', (req, res) => {
  try {
    const data = req.body
    if (!data?.matId) return res.status(400).json({ error: 'matId is required' })

    const capturedAt = new Date().toISOString()

    stmts.upsertMaterial.run({
      mat_id:     data.matId,
      mat_name:   data.matName ?? 'Unknown',
      updated_at: capturedAt,
    })

    const snapId = insertSnapshotTx(data.matId, data, capturedAt)
    res.json({ ok: true, snapshotId: snapId, capturedAt })
  } catch (e) {
    console.error('[ingest]', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ── Read ──────────────────────────────────────────────────────────────────────

// GET /db/snapshots/:matId?limit=60
router.get('/snapshots/:matId', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? 60), 2880)
    const rows  = stmts.getSnapshots.all(req.params.matId, limit)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /db/snapshot/:id/orders
router.get('/snapshot/:id/orders', (req, res) => {
  try {
    res.json(stmts.getSnapshotOrders.all(req.params.id))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /db/price-history/:matId?hours=24
router.get('/price-history/:matId', (req, res) => {
  try {
    const hours  = Math.min(parseInt(req.query.hours ?? 24), 180 * 24)
    const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString()
    res.json(stmts.getPriceHistory.all(req.params.matId, cutoff))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /db/order-changes/:matId?hours=1
router.get('/order-changes/:matId', (req, res) => {
  try {
    const hours   = Math.min(parseInt(req.query.hours ?? 1), 180 * 24)
    const cutoff  = new Date(Date.now() - hours * 3_600_000).toISOString()
    const snaps   = stmts.getPriceHistory.all(req.params.matId, cutoff)

    if (snaps.length < 2) {
      return res.json({ snapshots: snaps.length, added: [], removedCount: 0 })
    }

    const firstIds  = new Set(stmts.getSnapshotOrders.all(snaps[0].id).map(o => o.order_id))
    const lastOrders = stmts.getSnapshotOrders.all(snaps[snaps.length - 1].id)

    res.json({
      snapshots:    snaps.length,
      added:        lastOrders.filter(o => !firstIds.has(o.order_id)),
      removedCount: [...firstIds].filter(id => !lastOrders.find(o => o.order_id === id)).length,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /db/stats
router.get('/stats', (req, res) => {
  try {
    res.json(stmts.dbStats.get())
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
