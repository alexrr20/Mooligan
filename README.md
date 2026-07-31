# Mooligan

A minimal Electron desktop and Hono API monorepo built with Vite+ and pnpm.

- `apps/desktop`: Electron, React 19, TanStack Router, StyleX, and Motion
- `apps/api`: Hono 4 for Cloudflare Workers, served locally by Wrangler on
  `http://127.0.0.1:3000`
- `packages/domain`: shared catalog, collection, deck, list, and market types

Node.js 22.18 or newer is required.

## Development

Install dependencies, then start the API and Electron together:

```bash
vp install
vp run api#db:migrate:local
vp run dev
```

The migration creates a lightweight release record. With the API running, the
first request bootstraps it from Scryfall:

```bash
curl "http://127.0.0.1:3000/catalog/release"
```

The Worker repeats that check every six hours in production. It stores only the
current Scryfall release metadata in D1. The desktop downloads Scryfall's
`default_cards` JSONL gzip archive directly, streams it into a temporary SQLite
database, validates it, and atomically replaces the installed catalog. A failed
check or import leaves the existing offline catalog untouched.

Packaged desktop builds read the catalog service from `MOOLIGAN_API_URL`; local
development defaults to `http://127.0.0.1:3000`.

## Validation

Format, lint, type-check, test, and build every workspace:

```bash
vp run ready
```

The individual commands remain available when needed:

```bash
vp check
vp run -r test
vp run -r build
```

## Production build

Build both workspaces:

```bash
vp run -r build
```

Deploy the API to Cloudflare:

```bash
vp run api#db:migrate
vp run api#deploy
```

Apply the migration before deploying so the release endpoint always has its D1
table. If the record is empty, the first request populates it from Scryfall; it
returns `503` only if that bootstrap check fails.

Run the compiled desktop:

```bash
vp run desktop#start
```
