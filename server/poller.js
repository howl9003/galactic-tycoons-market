import cron from 'node-cron'
import { stmts, insertSnapshotTx } from './db.js'

const GT_BASE = 'https://api.g2.galactictycoons.com'
const CONCURRENCY = 8
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS ?? '180')

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Run tasks with bounded concurrency
async function runWithConcurrency(tasks, limit) {
  const results = []
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit).map(fn => fn())
    const settled = await Promise.allSettled(batch)
    results.push(...settled)
  }
  return results
}

async function pollOneMaterial(mat, capturedAt) {
  const data = await fetchJson(`${GT_BASE}/public/exchange/mat-details/${mat.matId}`)
  stmts.upsertMaterial.run({
    mat_id:     mat.matId,
    mat_name:   mat.matName,
    updated_at: capturedAt,
  })
  insertSnapshotTx(mat.matId, data, capturedAt)
}

export async function pollAll(materials) {
  const capturedAt = new Date().toISOString()
  console.log(`[poller] ${capturedAt} — polling ${materials.length} materials`)

  const tasks = materials.map(mat => () => pollOneMaterial(mat, capturedAt).catch(err => {
    console.warn(`[poller] ${mat.matName} (${mat.matId}) failed: ${err.message}`)
  }))

  const results = await runWithConcurrency(tasks, CONCURRENCY)
  const ok   = results.filter(r => r.status === 'fulfilled').length
  const fail = results.filter(r => r.status === 'rejected').length
  console.log(`[poller] done — ${ok} ok, ${fail} errored`)

  // Prune old data
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString()
  const { changes } = stmts.deleteOldSnapshots.run(cutoff)
  if (changes > 0) console.log(`[poller] pruned ${changes} snapshots older than ${RETENTION_DAYS}d`)
}

export async function seedMaterials() {
  const data = await fetchJson(`${GT_BASE}/public/exchange/mat-prices`)
  return data.prices.filter(m => m.currentPrice !== -1)
}

export function startPoller(materials) {
  // Poll every minute
  cron.schedule('* * * * *', () => pollAll(materials))

  // Kick off immediately
  pollAll(materials).catch(err => console.error('[poller] initial poll error:', err))
}
