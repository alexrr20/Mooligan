import assert from "node:assert/strict";
import { test } from "vite-plus/test";

import api from "../src/index.ts";

const card = {
  collector_number: "1",
  id: "demo-001",
  json: '{"id":"demo-001","name":"Mooligan Test Card"}',
  name: "Mooligan Test Card",
  oracle_id: null,
  set_code: "moo",
  updated_at: "2026-07-27T20:50:00Z",
};

test("GET /health reports a CORS-enabled healthy service", async () => {
  const response = await api.request("http://localhost/health");

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json/);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
});

test("GET /catalog and /catalog/cards expose a versioned catalog", async () => {
  const environment = { DB: catalogDatabase() } satisfies Pick<Env, "DB">;

  const metadataResponse = await api.request("http://localhost/catalog", undefined, environment);
  const cardsResponse = await api.request(
    "http://localhost/catalog/cards?version=dev-1",
    undefined,
    environment,
  );

  assert.equal(metadataResponse.status, 200);
  assert.deepEqual(await metadataResponse.json(), {
    version: "dev-1",
    cardCount: 1,
    updatedAt: "2026-07-27T20:50:00Z",
  });
  assert.equal(cardsResponse.status, 200);
  assert.deepEqual(await cardsResponse.json(), {
    cards: [card],
    nextCursor: null,
    version: "dev-1",
  });
});

test("GET /catalog/cards rejects a stale catalog version", async () => {
  const response = await api.request("http://localhost/catalog/cards?version=old", undefined, {
    DB: catalogDatabase(),
  });

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "catalog_changed" });
});

function catalogDatabase() {
  return {
    prepare(query: string) {
      let parameters: unknown[] = [];
      const statement = {
        bind(...values: unknown[]) {
          parameters = values;
          return statement;
        },
        async first<T>() {
          if (query.includes("card_count")) {
            return {
              card_count: 1,
              updated_at: "2026-07-27T20:50:00Z",
              version: "dev-1",
            } as T;
          }

          return { version: "dev-1" } as T;
        },
        async all<T>() {
          const cursor = parameters[0];
          return {
            meta: {},
            results: cursor === "" ? ([card] as T[]) : [],
            success: true,
          };
        },
      };

      return statement as D1PreparedStatement;
    },
  } as D1Database;
}
