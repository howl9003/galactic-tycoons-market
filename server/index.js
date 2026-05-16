// Shroomberg Terminal — DB server + market data poller
// Handles SQLite reads/writes AND polls the GT API every 5 minutes on the server side
// so data is captured 24/7 even when no browser is open.
import express from 'express'
import dbRouter       from './routes/db.js'
import { startPoller } from './poller.js'

const app  = express()
const PORT = parseInt(process.env.PORT ?? 3001)

// CORS — allow the Vercel frontend (and localhost in dev) to reach this server.
// Set FRONTEND_URL env var in Railway to your Vercel domain, e.g.:
//   https://galactic-tycoons-market.vercel.app
const ALLOWED = (process.env.FRONTEND_URL ?? '').split(',').map(s => s.trim()).filter(Boolean)

app.use((req, res, next) => {
  const origin = req.headers.origin ?? ''
  const allow  = ALLOWED.length === 0 || ALLOWED.includes(origin)
                   ? origin || '*'
                   : ALLOWED[0]
  res.header('Access-Control-Allow-Origin',  allow)
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// 2 MB limit — a full mat-details payload with 30d history is ~50 KB
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
)

app.use('/db', dbRouter)

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🍄  Shroomberg Terminal  DB       ║
  ║   http://localhost:${PORT}              ║
  ║   poller: every 5 min               ║
  ╚══════════════════════════════════════╝
  `)
  startPoller()
})
