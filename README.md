# 🍄 Shroomberg Terminal

Real-time market analysis dashboard for [Galactic Tycoons](https://galactictycoons.com).

## Features

### 📊 Overview
- **8 stat cards** — current price, 30d avg, supply, daily volume, 30d % change, volatility, days of supply, vs 30d VWAP
- **Price history chart** — 30-day line with avg reference line
- **Volume chart** — 30-day bar chart with peak day highlighted

### 📈 Level 2 Depth
- **Full order book** — every sell order, aggregated by price level or individual view; sticky header; scrollable
- **Market depth chart** — cumulative step chart showing true liquidity at every price level
- **Liquidity analysis** — 9 L2 metrics: total supply, total value locked, weighted avg ask, seller concentration, largest wall, depth at +10/20/50%, and more
- **Price impact simulator** — simulate buying 1K / 10K / 100K / 1M units → see avg cost, total cost, and slippage

### 🔬 Data Explorer
- **Raw API field dictionary** — every field from the GT exchange API with description and live value
- **Derived metrics table** — all 20+ secondary metrics with formulas

### 🗄️ DB History  *(requires server)*
- **Minute-level price chart** — time range selector (1h → 7d)
- **Snapshot browser** — click any row to expand and view the exact order book at that moment in time

### UI
- **Searchable + sortable sidebar** — 175 materials, filter by name/price/% change
- **Dark / light mode** — "Shroomberg" warm cream (default) and "Moonlit Forest" dark
- **Auto-refresh** — every 60 seconds, with countdown badge
- **Cute mushroom branding** — 🍄

---

## Setup

### Frontend only (no DB history)

```bash
npm install
npm run dev
```

Open http://localhost:5173. The Overview, Level 2, and Data Explorer tabs work immediately. DB History requires the server.

### Full stack (with DB history)

```bash
npm install
npm run dev:all      # starts both Vite (5173) and Express server (3001)
```

The server polls all 175 materials every 60 seconds and saves order book snapshots to `data/shroomberg.db` (SQLite). Data older than 7 days is automatically pruned.

> **Windows note:** `better-sqlite3` requires native compilation. If `npm install` fails, install [VS Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with "Desktop development with C++" workload, then retry.

---

## Architecture

```
├── server/
│   ├── index.js          Express entry point (port 3001)
│   ├── db.js             SQLite setup + prepared statements
│   ├── poller.js         Polls all 175 materials every minute
│   └── routes/
│       ├── db.js         /db/* — query historical snapshots
│       └── proxy.js      /api/* — transparent proxy to GT API
│
├── src/
│   ├── lib/
│   │   ├── format.js     Number/date formatting utilities
│   │   └── metrics.js    Pure metric calculations (L2 + history)
│   ├── hooks/
│   │   ├── useMaterials.js
│   │   ├── useMatDetails.js
│   │   └── useOrderbookHistory.js
│   └── components/
│       ├── Sidebar.jsx, StatCards.jsx, PriceChart.jsx, VolumeChart.jsx
│       ├── OrderBook.jsx, DepthChart.jsx, LiquidityPanel.jsx
│       ├── DataExplorer.jsx, HistoryPanel.jsx
│       └── TabPanel.jsx, ShroomLogo.jsx, ThemeToggle.jsx
│
├── vite.config.js        Dev proxy: /api + /db → localhost:3001
└── vercel.json           Production: /api/* → GT API direct
```

## Deploy

### Vercel (frontend only)
```bash
vercel --prod
```
`vercel.json` rewrites `/api/*` to GT directly. The `/db/*` routes won't work — deploy the Express server separately for that.

### Full stack on Railway / Fly.io / Render
Set `PORT` env var, run `npm start` (`node server/index.js`). Build the frontend first with `npm run build` and serve `dist/` statically from Express if needed.

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/public/exchange/mat-prices` | All material prices (proxied from GT) |
| `GET /api/public/exchange/mat-details/:id` | Full L2 data for one material |
| `GET /db/snapshots/:matId?limit=60` | Recent DB snapshots |
| `GET /db/snapshot/:id/orders` | Orders for a specific snapshot |
| `GET /db/price-history/:matId?hours=24` | Minute-level price from DB |
| `GET /db/order-changes/:matId?hours=1` | Orders added/removed in window |
| `GET /db/stats` | Global DB coverage stats |
| `POST /admin/poll` | Trigger immediate poll of all materials |
