import assert from "node:assert/strict";
import { test } from "node:test";

import { CatalogPageSchema } from "../src/catalog-sync.ts";
import { DeckEntrySchema } from "../src/decks.ts";

void test("deck entries require an exact printing, finish, and positive quantity", () => {
  const entry = {
    finish: "foil",
    id: "entry-1",
    printingId: "printing-1",
    quantity: 1,
    section: "mainboard",
  };

  assert.deepEqual(DeckEntrySchema.parse(entry), entry);
  assert.equal(DeckEntrySchema.safeParse({ ...entry, printingId: "" }).success, false);
  assert.equal(DeckEntrySchema.safeParse({ ...entry, quantity: 0 }).success, false);
});

void test("catalog pages cannot exceed the download page size", () => {
  const card = {
    collector_number: "1",
    id: "printing-1",
    json: "{}",
    name: "Mooligan Test Card",
    oracle_id: null,
    set_code: "moo",
    updated_at: "2026-07-31T10:00:00Z",
  };

  assert.equal(
    CatalogPageSchema.safeParse({
      cards: Array.from({ length: 501 }, () => card),
      nextCursor: null,
      version: "test-1",
    }).success,
    false,
  );
});
