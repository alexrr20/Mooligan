# Mooligan

A minimal Electron desktop and Fastify API monorepo built with Vite+ and pnpm.

- `apps/desktop`: Electron, React 19, TanStack Router, StyleX, and Motion
- `apps/api`: Fastify 5 on `http://127.0.0.1:3000`

Node.js 22.18 or newer is required.

## Development

Install dependencies, then start the API and Electron together:

```bash
vp install
vp run dev
```

The desktop renderer calls the public health endpoint at
`GET http://127.0.0.1:3000/health`. The API runs independently; Electron does
not start or stop it.

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

Run the API and compiled desktop in separate terminals:

```bash
vp run api#start
```

```bash
vp run desktop#start
```
