// Shroomberg Terminal — local DB server
// This server ONLY handles SQLite reads and writes.
// It makes ZERO outbound network calls — the browser fetches the GT API directly.
import express from 'express'
import dbRouter from './routes/db.js'

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
  ║   (no outbound calls — DB only)     ║
  ╚══════════════════════════════════════╝
  `)
})
