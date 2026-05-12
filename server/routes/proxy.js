import { Router } from 'express'

const GT_BASE = 'https://api.g2.galactictycoons.com'
const router  = Router()

// Transparent proxy: /api/* → GT API
router.all('*', async (req, res) => {
  const qs     = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const target = `${GT_BASE}${req.path}${qs}`

  try {
    const upstream = await fetch(target, {
      method:  req.method,
      headers: { 'Content-Type': 'application/json' },
      signal:  AbortSignal.timeout(10_000),
    })
    const data = await upstream.json()
    res.status(upstream.status).json(data)
  } catch (e) {
    res.status(502).json({ error: `GT API unreachable: ${e.message}` })
  }
})

export default router
