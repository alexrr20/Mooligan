import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { recoverInterruptedReplacement } from "../electron/catalog-files.ts";

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
