// Shroomberg Terminal — local DB server
// This server ONLY handles SQLite reads and writes.
// It makes ZERO outbound network calls — the browser fetches the GT API directly.
import express from 'express'
import dbRouter from './routes/db.js'

const app  = express()
const PORT = parseInt(process.env.PORT ?? 3001)

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
