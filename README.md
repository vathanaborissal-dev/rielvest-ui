# RielVest UI

The investor-facing Next.js application for RielVest, a Cambodia-first market intelligence platform for the Cambodia Securities Exchange.

## Current routes

- `/` shows the latest recorded CSX session, sourced market metrics, market breadth and RielVest commentary.
- `/stocks` provides searchable and sortable access to every listed company in the API.
- `/stocks/[symbol]` combines company reference data, an interactive TradingView Lightweight Chart, valuation metrics, dynamic structured analysis and dividend records. The chart supports candle and line modes, volume, zooming, crosshair inspection, and minute through monthly intervals.

Missing figures are shown as unavailable. The interface does not provide mock market numbers.

## Local setup

Start the API from `../rielvest_api` first. It listens on port 4000 by default.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set `RIELVEST_API_URL` when the API is hosted somewhere else:

```text
RIELVEST_API_URL=https://api.example.com/api
NEXT_PUBLIC_RIELVEST_API_URL=https://api.example.com/api
```

`RIELVEST_API_URL` is used by Next.js Server Components. The `NEXT_PUBLIC_`
variant lets the interactive chart refresh directly from the API in the browser.

## Verification

```bash
npm run lint
npm run build
```

The application uses locally hosted Geist font files, CSS variables for automatic light and dark color schemes, and server-rendered API requests. Interactive chart bars refresh every 30 seconds and stock analysis is revalidated within 60 seconds.
