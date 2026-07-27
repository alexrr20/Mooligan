import { Hono } from "hono";
import { cors } from "hono/cors";

type CatalogMeta = {
  card_count: number;
  updated_at: string;
  version: string;
};

type CardRow = {
  collector_number: string;
  id: string;
  json: string;
  name: string;
  oracle_id: string | null;
  set_code: string;
  updated_at: string;
};

const pageSize = 500;
const api = new Hono<{ Bindings: Env }>();

api.use("*", cors());

api.get("/health", (context) => context.json({ status: "ok" as const }));

api.get("/catalog", async (context) => {
  const catalog = await context.env.DB.prepare(
    "SELECT version, card_count, updated_at FROM catalog_meta WHERE singleton = 1",
  ).first<CatalogMeta>();

  if (!catalog) {
    return context.json({ error: "catalog_unavailable" as const }, 503);
  }

  return context.json({
    version: catalog.version,
    cardCount: catalog.card_count,
    updatedAt: catalog.updated_at,
  });
});

api.get("/catalog/cards", async (context) => {
  const version = context.req.query("version");
  const cursor = context.req.query("cursor") ?? "";

  if (!version || cursor.length > 128) {
    return context.json({ error: "invalid_request" as const }, 400);
  }

  const catalog = await context.env.DB.prepare(
    "SELECT version FROM catalog_meta WHERE singleton = 1",
  ).first<{ version: string }>();

  if (!catalog) {
    return context.json({ error: "catalog_unavailable" as const }, 503);
  }

  if (catalog.version !== version) {
    return context.json({ error: "catalog_changed" as const }, 409);
  }

  const { results } = await context.env.DB.prepare(
    `SELECT id, oracle_id, name, set_code, collector_number, json, updated_at
     FROM cards
     WHERE id > ?
     ORDER BY id
     LIMIT ?`,
  )
    .bind(cursor, pageSize + 1)
    .all<CardRow>();

  const hasNextPage = results.length > pageSize;
  const cards = hasNextPage ? results.slice(0, pageSize) : results;

  return context.json({
    cards,
    nextCursor: hasNextPage ? cards.at(-1)?.id : null,
    version: catalog.version,
  });
});

export default api;
