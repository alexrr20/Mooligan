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

The local migration creates the D1 catalog schema. Card rows and the singleton
`catalog_meta` publication record must be loaded before the desktop download is
available.

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
vp run api#deploy
```

Run the compiled desktop:

```bash
vp run desktop#start
```
