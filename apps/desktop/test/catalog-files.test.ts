import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { Worker } from "node:worker_threads";
import { gzipSync } from "node:zlib";

import { recoverInterruptedReplacement } from "../electron/catalog-files.ts";
import { importCatalog, readGzipJsonLines } from "../electron/catalog-import.ts";
import { createCatalogQuery, type CatalogQueryWorkerResponse } from "../electron/catalog-query.ts";

void test("an interrupted catalog replacement restores the previous catalog", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mooligan-catalog-"));
  const destination = join(directory, "cards.sqlite");
  const backup = `${destination}.previous`;

  try {
    await writeFile(backup, "valid catalog");
    await recoverInterruptedReplacement(destination, backup);

    assert.equal(await readFile(destination, "utf8"), "valid catalog");
    await assert.rejects(readFile(backup), { code: "ENOENT" });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

void test("a gzipped Scryfall JSONL archive becomes a validated local catalog", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mooligan-import-"));
  const destination = join(directory, "cards.sqlite");
  const cards = [
    {
      collector_number: "1",
      id: "printing-1",
      name: "Mooligan Test Card",
      object: "card",
      oracle_id: "oracle-1",
      rarity: "rare",
      set: "moo",
      set_name: "Mooligan Test Set",
      type_line: "Artifact",
    },
    {
      collector_number: "2",
      id: "printing-2",
      name: "Second Test Card",
      object: "card",
      rarity: "common",
      set: "moo",
      set_name: "Mooligan Test Set",
      card_faces: [{ type_line: "Creature — Test" }, { type_line: "Creature — Test" }],
    },
  ];
  const archive = gzipSync(`${cards.map((card) => JSON.stringify(card)).join("\n")}\n`);
  const progress: number[] = [];

  try {
    const snapshot = await importCatalog(
      destination,
      {
        compressedSize: archive.byteLength,
        downloadUrl: "https://data.scryfall.io/default-cards/test.jsonl.gz",
        updatedAt: "2026-07-31T09:11:02.266+00:00",
      },
      readGzipJsonLines(Readable.from([archive])),
      (completedCards) => progress.push(completedCards),
    );
    const database = new DatabaseSync(destination, { readOnly: true });

    try {
      assert.deepEqual(snapshot, {
        cardCount: 2,
        updatedAt: "2026-07-31T09:11:02.266+00:00",
      });
      assert.deepEqual(progress, [2]);
      assert.deepEqual(
        database
          .prepare("SELECT id, set_code FROM cards ORDER BY id")
          .all()
          .map((row) => ({ ...row })),
        [
          { id: "printing-1", set_code: "moo" },
          { id: "printing-2", set_code: "moo" },
        ],
      );
      const queryCatalog = createCatalogQuery(database);

      assert.deepEqual(queryCatalog({ limit: 1 }), {
        cards: [
          {
            collectorNumber: "1",
            id: "printing-1",
            name: "Mooligan Test Card",
            rarity: "rare",
            setCode: "moo",
            setName: "Mooligan Test Set",
            typeLine: "Artifact",
          },
        ],
        hasMore: true,
        total: 2,
      });
      assert.deepEqual(queryCatalog({ limit: 1, query: "second" }), {
        cards: [
          {
            collectorNumber: "2",
            id: "printing-2",
            name: "Second Test Card",
            rarity: "common",
            setCode: "moo",
            setName: "Mooligan Test Set",
            typeLine: "Creature — Test",
          },
        ],
        hasMore: false,
        total: 1,
      });
      assert.deepEqual(
        queryCatalog({ query: "creat" }).cards.map((card) => card.id),
        ["printing-2"],
      );
      assert.deepEqual(queryCatalog({ query: "///" }), {
        cards: [],
        hasMore: false,
        total: 0,
      });
      assert.ok(
        database
          .prepare(
            `EXPLAIN QUERY PLAN
             SELECT id
             FROM cards
             ORDER BY name COLLATE NOCASE,
                      set_code COLLATE NOCASE,
                      collector_number COLLATE NOCASE
             LIMIT 100`,
          )
          .all()
          .some(
            (row) =>
              typeof row.detail === "string" &&
              row.detail.includes("USING INDEX cards_browse_order"),
          ),
      );

      const worker = new Worker(new URL("../electron/catalog-query-worker.ts", import.meta.url), {
        workerData: destination,
      });

      try {
        const response = await new Promise<CatalogQueryWorkerResponse>((resolve, reject) => {
          worker.once("error", reject);
          worker.once("message", resolve);
          worker.postMessage({ id: 1, request: { query: "second" } });
        });

        assert.deepEqual(response, {
          id: 1,
          page: {
            cards: [
              {
                collectorNumber: "2",
                id: "printing-2",
                name: "Second Test Card",
                rarity: "common",
                setCode: "moo",
                setName: "Mooligan Test Set",
                typeLine: "Creature — Test",
              },
            ],
            hasMore: false,
            total: 1,
          },
        });
      } finally {
        await worker.terminate();
      }
    } finally {
      database.close();
    }
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
