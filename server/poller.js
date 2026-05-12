import cron from 'node-cron'
import { stmts, insertSnapshotTx } from './db.js'

const GT_BASE        = 'https://api.g2.galactictycoons.com'
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS ?? '180')
const DELAY_MS       = parseInt(process.env.POLL_DELAY_MS  ?? '400')  // ms between each material request

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── HTTP with 429-aware retry ─────────────────────────────────────────────────

async function fetchJson(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let res
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(12_000) })
    } catch (e) {
      if (attempt === retries) throw e
      await sleep(1_500)
      continue
    }

    if (res.status === 429) {
      // Respect Retry-After header if present, else back off exponentially
      const retryAfter = parseInt(res.headers.get('retry-after') ?? '0') * 1000
      const wait = retryAfter || 2_000 * (attempt + 1)
      console.warn(`[poller] 429 on ${url} — waiting ${wait}ms (attempt ${attempt + 1}/${retries})`)
      await sleep(wait)
      continue
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }
  throw new Error(`Failed after ${retries} retries: ${url}`)
}

// ── Poll one material ─────────────────────────────────────────────────────────

async function pollOneMaterial(mat, capturedAt) {
  const data = await fetchJson(`${GT_BASE}/public/exchange/mat-details/${mat.matId}`)
  stmts.upsertMaterial.run({
    mat_id:     mat.matId,
    mat_name:   mat.matName,
    updated_at: capturedAt,
  })
  insertSnapshotTx(mat.matId, data, capturedAt)
}

// ── Poll all — sequential with fixed delay to stay under rate limits ──────────

let isPolling = false   // guard: skip tick if previous poll is still running

export async function pollAll(materials) {
  if (isPolling) {
    console.log('[poller] Previous poll still running — skipping this tick')
    return
  }
  isPolling = true

  const capturedAt = new Date().toISOString()
  const t0 = Date.now()
  console.log(`[poller] ${capturedAt} — polling ${materials.length} materials (${DELAY_MS}ms delay between each)`)

  let ok = 0, fail = 0

  for (const mat of materials) {
    try {
      await pollOneMaterial(mat, capturedAt)
      ok++
    } catch (err) {
      console.warn(`[poller] ✗ ${mat.matName} (${mat.matId}): ${err.message}`)
      fail++
    }
    await sleep(DELAY_MS)
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`[poller] ✓ done in ${elapsed}s — ${ok} ok, ${fail} errored`)

  // Prune data older than RETENTION_DAYS
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString()
  const { changes } = stmts.deleteOldSnapshots.run(cutoff)
  if (changes > 0) console.log(`[poller] pruned ${changes} snapshots older than ${RETENTION_DAYS} days`)

  isPolling = false
}

// ── Seed material list from GT API ────────────────────────────────────────────

export async function seedMaterials() {
  const data = await fetchJson(`${GT_BASE}/public/exchange/mat-prices`)
  return data.prices.filter(m => m.currentPrice !== -1)
}

// ── Start cron ────────────────────────────────────────────────────────────────
// Every 2 minutes — sequential poll of 175 materials at 400ms/each takes ~70s,
// so we need >1 minute between starts to avoid overlap.

export function startPoller(materials) {
  cron.schedule('*/2 * * * *', () => pollAll(materials))

  // Initial poll — delay 5s to let the server finish starting up
  setTimeout(() => pollAll(materials), 5_000)
}
