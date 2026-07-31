import assert from "node:assert/strict";
import { test } from "node:test";

import { CatalogReleaseSchema } from "../src/catalog-sync.ts";
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

void test("catalog releases require an HTTPS archive and timestamp", () => {
  const release = {
    compressedSize: 1024,
    downloadUrl: "https://data.scryfall.io/default-cards/test.jsonl.gz",
    updatedAt: "2026-07-31T09:11:02.266+00:00",
  };

  assert.deepEqual(CatalogReleaseSchema.parse(release), release);
  assert.equal(
    CatalogReleaseSchema.safeParse({ ...release, downloadUrl: "http://example.com/cards.gz" })
      .success,
    false,
  );
});
