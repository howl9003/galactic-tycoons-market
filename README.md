# Galactic Tycoons Market

A real-time market analysis dashboard for the [Galactic Tycoons](https://galactictycoons.com) browser game.

## Features

- **Material browser** — searchable, sortable list of all 175+ tradeable materials
- **Stat cards** — current price, 30-day avg, supply, daily volume, 30d % change
- **Price history** — 30-day line chart with average price reference line
- **Volume chart** — 30-day daily volume bar chart
- **Order book** — live sell orders with depth visualization
- **Dark / light mode** — persisted to localStorage
- **Auto-refresh** — data refreshes every 60 seconds

## Setup

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` → `https://api.g2.galactictycoons.com` to avoid CORS.

## Deploy to Vercel

`vercel.json` is included and rewrites `/api/*` to the GT API for production.

```bash
vercel --prod
```

## Tech

- React 18 + Vite
- Recharts (charts)
- DM Sans (UI) + Space Mono (numbers) via Google Fonts
- Public GT Exchange API (`/public/exchange/mat-prices`, `/public/exchange/mat-details/{id}`)
