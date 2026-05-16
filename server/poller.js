// Shroomberg Terminal — server-side market data poller
// Runs on Railway 24/7, independently of whether the browser is open.
// Fetches all active materials sequentially (1 s gap) every 5 minutes.

import { stmts, insertSnapshotTx } from './db.js'

const GT_API           = 'https://api.g2.galactictycoons.com'
const CYCLE_MS         = parseInt(process.env.POLL_INTERVAL_MS  ?? String(5 * 60 * 1000))  // 5 min
const BETWEEN_REQS_MS  = parseInt(process.env.POLL_BETWEEN_MS   ?? '1000')                 // 1 s
const STARTUP_DELAY_MS = 15_000   // let the server settle before first cycle

let isPolling  = false
let intervalId = null

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function gtFetch(path, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${GT_API}${path}`)

    if (res.status === 429) {
      const wait = parseInt(res.headers.get('retry-after') ?? '60') * 1_000
      console.log(`[poller] 429 on ${path} — backing off ${wait / 1000}s`)
      await sleep(wait)
      continue   // retry same attempt index (don't count as a retry)
    }

    if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`)
    return res.json()
  }
  throw new Error(`Gave up after ${retries} retries: ${path}`)
}

// ── Main cycle ────────────────────────────────────────────────────────────────

async function runCycle() {
  if (isPolling) {
    console.log('[poller] Previous cycle still running — skipping tick')
    return
  }

  isPolling = true
  const t0 = Date.now()

  try {
    // 1. Fetch active material list
    const listData  = await gtFetch('/public/exchange/mat-prices')
    const materials = (listData.prices ?? []).filter(m => m.currentPrice !== -1)
    console.log(`[poller] Cycle start — ${materials.length} active materials`)

    let saved = 0, failed = 0

    // 2. Walk each material sequentially
    for (const mat of materials) {
      await sleep(BETWEEN_REQS_MS)

      try {
        const data       = await gtFetch(`/public/exchange/mat-details/${mat.matId}`)
        const capturedAt = new Date().toISOString()

        stmts.upsertMaterial.run({
          mat_id:     data.matId,
          mat_name:   data.matName ?? 'Unknown',
          updated_at: capturedAt,
        })

        insertSnapshotTx(data.matId, data, capturedAt)
        saved++
      } catch (e) {
        console.error(`[poller] mat ${mat.matId} failed: ${e.message}`)
        failed++
      }
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    console.log(`[poller] Cycle done in ${elapsed}s — saved: ${saved}  failed: ${failed}`)
  } catch (e) {
    console.error('[poller] Cycle error:', e.message)
  } finally {
    isPolling = false
  }
}

// ── Start / stop ──────────────────────────────────────────────────────────────

export function startPoller() {
  console.log(`[poller] Scheduled — first cycle in ${STARTUP_DELAY_MS / 1000}s, then every ${CYCLE_MS / 60_000} min`)

  setTimeout(() => {
    runCycle()
    intervalId = setInterval(runCycle, CYCLE_MS)
  }, STARTUP_DELAY_MS)
}

export function stopPoller() {
  if (intervalId) { clearInterval(intervalId); intervalId = null }
}
