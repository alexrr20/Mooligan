import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { gzipSync } from "node:zlib";

import { recoverInterruptedReplacement } from "../electron/catalog-files.ts";
import { importCatalog, readGzipJsonLines } from "../electron/catalog-import.ts";

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
      set: "moo",
    },
    {
      collector_number: "2",
      id: "printing-2",
      name: "Second Test Card",
      object: "card",
      set: "moo",
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
    } finally {
      database.close();
    }
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
