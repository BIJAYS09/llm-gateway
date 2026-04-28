# Prism UI

Next.js dashboard for the [Prism LLM Gateway](../prism/) backend.

## Pages

| Route | Description |
|---|---|
| `/` | Overview — key metrics, cost trend chart, model breakdown |
| `/playground` | Chat UI wired directly through the Prism proxy |
| `/calls` | Filterable table of recent LLM calls with cache/cost metadata |
| `/cost` | 14-day cost trend, routing efficiency bars, full routing table |
| `/settings` | Env var reference, API docs, cache threshold guide |

## Stack

- **Next.js 14** App Router
- **Tailwind CSS** — custom dark design system
- **Recharts** — cost area chart, model routing bar chart
- **Lucide React** — icons
- **JetBrains Mono + Syne + DM Sans** — typography

## Quickstart

```bash
cd prism-ui

# Install
npm install

# Configure
cp .env.local.example .env.local
# (default NEXT_PUBLIC_API_URL=http://localhost:8000 works with docker-compose)

# Dev server
npm run dev
# → http://localhost:3000

# Production build
npm run build && npm start
```

## Running with the backend

Start both with Docker:

```bash
# From the prism/ backend folder
docker-compose up --build

# Then in this folder
npm run dev
```

Or update `NEXT_PUBLIC_API_URL` in `.env.local` to point at any deployed Prism instance.
