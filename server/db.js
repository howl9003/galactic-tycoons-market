// Uses Node.js built-in SQLite (node:sqlite) — available since Node 22.5, stable in Node 23+.
// No native compilation needed; works out of the box on Node 24.
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR   = join(__dirname, '..', 'data')
const DB_PATH    = join(DATA_DIR, 'shroomberg.db')

mkdirSync(DATA_DIR, { recursive: true })

const db = new DatabaseSync(DB_PATH)

// Performance & safety pragmas
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA synchronous = NORMAL')
db.exec('PRAGMA foreign_keys = ON')
db.exec('PRAGMA busy_timeout = 5000')

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS materials (
    mat_id     INTEGER PRIMARY KEY,
    mat_name   TEXT    NOT NULL,
    updated_at TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS snapshots (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    mat_id              INTEGER NOT NULL REFERENCES materials(mat_id),
    captured_at         TEXT    NOT NULL,
    current_price       INTEGER,
    avg_price           INTEGER,
    total_qty_available INTEGER,
    avg_qty_sold_daily  INTEGER,
    order_count         INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_snap_mat_time
    ON snapshots(mat_id, captured_at DESC);

  CREATE TABLE IF NOT EXISTS snapshot_orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id  INTEGER NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
    order_id     INTEGER,
    company_id   INTEGER,
    company_name TEXT,
    unit_price   INTEGER NOT NULL,
    qty          INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_so_snapshot
    ON snapshot_orders(snapshot_id);
`)

// ── Transaction helper (mimics better-sqlite3's db.transaction()) ─────────────

function makeTransaction(fn) {
  return (...args) => {
    db.exec('BEGIN')
    try {
      const result = fn(...args)
      db.exec('COMMIT')
      return result
    } catch (err) {
      try { db.exec('ROLLBACK') } catch (_) { /* ignore rollback error */ }
      throw err
    }
  }
}

// ── Prepared statements ───────────────────────────────────────────────────────

export const stmts = {
  upsertMaterial: db.prepare(`
    INSERT INTO materials (mat_id, mat_name, updated_at)
    VALUES (@mat_id, @mat_name, @updated_at)
    ON CONFLICT(mat_id) DO UPDATE
      SET mat_name = excluded.mat_name, updated_at = excluded.updated_at
  `),

  insertSnapshot: db.prepare(`
    INSERT INTO snapshots
      (mat_id, captured_at, current_price, avg_price,
       total_qty_available, avg_qty_sold_daily, order_count)
    VALUES
      (@mat_id, @captured_at, @current_price, @avg_price,
       @total_qty_available, @avg_qty_sold_daily, @order_count)
  `),

  insertOrder: db.prepare(`
    INSERT INTO snapshot_orders
      (snapshot_id, order_id, company_id, company_name, unit_price, qty)
    VALUES
      (@snapshot_id, @order_id, @company_id, @company_name, @unit_price, @qty)
  `),

  getSnapshots: db.prepare(`
    SELECT id, captured_at, current_price, avg_price,
           total_qty_available, avg_qty_sold_daily, order_count
    FROM   snapshots
    WHERE  mat_id = ?
    ORDER  BY captured_at DESC
    LIMIT  ?
  `),

  getSnapshotOrders: db.prepare(`
    SELECT order_id, company_id, company_name, unit_price, qty
    FROM   snapshot_orders
    WHERE  snapshot_id = ?
    ORDER  BY unit_price ASC
  `),

  getPriceHistory: db.prepare(`
    SELECT id, captured_at, current_price, avg_price,
           total_qty_available, avg_qty_sold_daily, order_count
    FROM   snapshots
    WHERE  mat_id = ? AND captured_at >= ?
    ORDER  BY captured_at ASC
  `),

  dbStats: db.prepare(`
    SELECT
      (SELECT COUNT(*)               FROM snapshots)       AS total_snapshots,
      (SELECT COUNT(*)               FROM snapshot_orders) AS total_orders,
      (SELECT COUNT(DISTINCT mat_id) FROM snapshots)       AS tracked_materials,
      (SELECT MIN(captured_at)       FROM snapshots)       AS oldest_snapshot,
      (SELECT MAX(captured_at)       FROM snapshots)       AS newest_snapshot
  `),

  deleteOldSnapshots: db.prepare(`
    DELETE FROM snapshots WHERE captured_at < ?
  `),
}

// ── Batch insert transaction ──────────────────────────────────────────────────

export const insertSnapshotTx = makeTransaction((matId, apiData, capturedAt) => {
  const { lastInsertRowid } = stmts.insertSnapshot.run({
    mat_id:              matId,
    captured_at:         capturedAt,
    current_price:       apiData.currentPrice       ?? null,
    avg_price:           apiData.avgPrice           ?? null,
    total_qty_available: apiData.totalQtyAvailable  ?? null,
    avg_qty_sold_daily:  apiData.avgQtySoldDaily    ?? null,
    order_count:         apiData.orders?.length     ?? 0,
  })

  for (const order of (apiData.orders ?? [])) {
    stmts.insertOrder.run({
      snapshot_id:  lastInsertRowid,
      order_id:     order.id    ?? null,
      company_id:   order.cId   ?? null,
      company_name: order.cName ?? null,
      unit_price:   order.unitPrice,
      qty:          order.qty,
    })
  }

  return lastInsertRowid
})

export default db
