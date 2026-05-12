import express from 'express'
import dbRouter    from './routes/db.js'
import proxyRouter from './routes/proxy.js'
import { seedMaterials, startPoller, pollAll } from './poller.js'

const app  = express()
const PORT = parseInt(process.env.PORT ?? 3001)

app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
)

// Manual poll trigger (useful for testing)
app.post('/admin/poll', async (_req, res) => {
  try {
    const mats = await seedMaterials()
    await pollAll(mats)
    res.json({ ok: true, materials: mats.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.use('/db',  dbRouter)
app.use('/api', proxyRouter)

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🍄  Shroomberg Terminal  Server   ║
  ║   http://localhost:${PORT}              ║
  ╚══════════════════════════════════════╝
  `)

  try {
    const materials = await seedMaterials()
    console.log(`[server] Loaded ${materials.length} materials — starting poller`)
    startPoller(materials)
  } catch (e) {
    console.error('[server] Failed to seed materials:', e.message)
    console.error('[server] Retrying in 30s…')
    setTimeout(async () => {
      try {
        const materials = await seedMaterials()
        startPoller(materials)
      } catch (e2) {
        console.error('[server] Retry failed:', e2.message)
      }
    }, 30_000)
  }
})
