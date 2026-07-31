import { mkdir, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { CatalogSnapshotSchema, type CatalogSnapshot } from "@mooligan/domain/catalog";
import { CatalogPageSchema, type CatalogPage } from "@mooligan/domain/catalog-sync";
import { app, ipcMain, net, type IpcMainInvokeEvent } from "electron";

import { recoverInterruptedReplacement } from "./catalog-files";

export type CatalogProgress = {
  completed: number;
  total: number;
};

export type CatalogStatus = { installed: false } | (CatalogSnapshot & { installed: true });

const apiBaseUrl = process.env.MOOLIGAN_API_URL ?? "http://127.0.0.1:3000";
let activeDownload: Promise<CatalogStatus> | undefined;

export function registerCatalogIpc() {
  ipcMain.handle("catalog:status", getCatalogStatus);
  ipcMain.handle("catalog:download", (event) => {
    activeDownload ??= downloadCatalog(event).finally(() => {
      activeDownload = undefined;
    });

    return activeDownload;
  });
}

async function getCatalogStatus(): Promise<CatalogStatus> {
  const path = catalogPath();

  await recoverInterruptedReplacement(path, `${path}.previous`);

  try {
    await stat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { installed: false };
    }

    throw error;
  }

  try {
    const database = new DatabaseSync(path, { readOnly: true });

    try {
      const row = database
        .prepare(
          "SELECT version, card_count AS cardCount, updated_at AS updatedAt FROM catalog_meta WHERE singleton = 1",
        )
        .get();

      const snapshot = CatalogSnapshotSchema.safeParse(row);
      return snapshot.success ? { installed: true, ...snapshot.data } : { installed: false };
    } finally {
      database.close();
    }
  } catch {
    return { installed: false };
  }
}

async function downloadCatalog(event: IpcMainInvokeEvent): Promise<CatalogStatus> {
  const metadata = await fetchCatalogMeta();

  if (metadata.cardCount === 0) {
    throw new Error("The card catalog has not been published yet.");
  }

  const destination = catalogPath();
  const partial = `${destination}.part`;
  const backup = `${destination}.previous`;

  await mkdir(join(app.getPath("userData"), "catalog"), { recursive: true });
  await rm(partial, { force: true });

  const database = new DatabaseSync(partial);
  let completed = 0;

  try {
    createCatalogSchema(database);
    const insert = database.prepare(
      `INSERT INTO cards
       (id, oracle_id, name, set_code, collector_number, json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    let cursor: string | null = "";

    sendProgress(event, { completed, total: metadata.cardCount });

    while (cursor !== null) {
      const page = await fetchCatalogPage(metadata.version, cursor);

      if (page.version !== metadata.version) {
        throw new Error("The card catalog changed during the download. Please try again.");
      }

      database.exec("BEGIN");

      try {
        for (const card of page.cards) {
          insert.run(
            card.id,
            card.oracle_id,
            card.name,
            card.set_code,
            card.collector_number,
            card.json,
            card.updated_at,
          );
        }

        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }

      completed += page.cards.length;
      sendProgress(event, { completed, total: metadata.cardCount });

      if (page.nextCursor !== null && page.nextCursor <= cursor) {
        throw new Error("The card catalog returned an invalid cursor.");
      }

      cursor = page.nextCursor;
    }

    const currentMetadata = await fetchCatalogMeta();

    if (
      completed !== metadata.cardCount ||
      currentMetadata.version !== metadata.version ||
      currentMetadata.cardCount !== metadata.cardCount
    ) {
      throw new Error("The card catalog changed during the download. Please try again.");
    }

    database
      .prepare(
        `INSERT INTO catalog_meta (singleton, version, card_count, updated_at)
         VALUES (1, ?, ?, ?)`,
      )
      .run(metadata.version, metadata.cardCount, metadata.updatedAt);
  } catch (error) {
    database.close();
    await rm(partial, { force: true });
    throw error;
  }

  database.close();
  validateCatalog(partial, metadata);
  await replaceCatalog(partial, destination, backup);

  return { installed: true, ...metadata };
}

function createCatalogSchema(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE catalog_meta (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      version TEXT NOT NULL,
      card_count INTEGER NOT NULL CHECK (card_count >= 0),
      updated_at TEXT NOT NULL
    );

    CREATE TABLE cards (
      id TEXT PRIMARY KEY,
      oracle_id TEXT,
      name TEXT NOT NULL,
      set_code TEXT NOT NULL,
      collector_number TEXT NOT NULL,
      json TEXT NOT NULL CHECK (json_valid(json)),
      updated_at TEXT NOT NULL
    );

    CREATE INDEX cards_name ON cards (name);
    CREATE INDEX cards_oracle_id ON cards (oracle_id);
    CREATE INDEX cards_set_code ON cards (set_code);
  `);
}

async function fetchCatalogMeta(): Promise<CatalogSnapshot> {
  const response = await net.fetch(catalogUrl("catalog"));

  if (!response.ok) {
    throw new Error(
      response.status === 503
        ? "The card catalog has not been published yet."
        : `The catalog service returned HTTP ${response.status}.`,
    );
  }

  const snapshot = CatalogSnapshotSchema.safeParse(await response.json());

  if (!snapshot.success) {
    throw new Error("The catalog service returned invalid metadata.");
  }

  return snapshot.data;
}

async function fetchCatalogPage(version: string, cursor: string): Promise<CatalogPage> {
  const url = new URL(catalogUrl("catalog/cards"));
  url.searchParams.set("version", version);

  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  const response = await net.fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      response.status === 409
        ? "The card catalog changed during the download. Please try again."
        : `The catalog service returned HTTP ${response.status}.`,
    );
  }

  const page = CatalogPageSchema.safeParse(await response.json());

  if (!page.success) {
    throw new Error("The catalog service returned an invalid card page.");
  }

  return page.data;
}

function validateCatalog(path: string, expected: CatalogSnapshot) {
  const database = new DatabaseSync(path, { readOnly: true });

  try {
    const check = database.prepare("PRAGMA quick_check").get();
    const metadata = database
      .prepare(
        "SELECT version, card_count AS cardCount, updated_at AS updatedAt FROM catalog_meta WHERE singleton = 1",
      )
      .get();
    const count = database.prepare("SELECT COUNT(*) AS cardCount FROM cards").get();
    const snapshot = CatalogSnapshotSchema.safeParse(metadata);

    if (
      !isRecord(check) ||
      check.quick_check !== "ok" ||
      !snapshot.success ||
      !isRecord(count) ||
      count.cardCount !== expected.cardCount ||
      snapshot.data.version !== expected.version
    ) {
      throw new Error("The downloaded card database failed validation.");
    }
  } finally {
    database.close();
  }
}

async function replaceCatalog(partial: string, destination: string, backup: string) {
  await recoverInterruptedReplacement(destination, backup);
  await rm(backup, { force: true });

  try {
    await rename(destination, backup);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  try {
    await rename(partial, destination);
  } catch (error) {
    try {
      await rename(backup, destination);
    } catch {
      // The previous catalog did not exist or could not be restored.
    }

    throw error;
  }

  await rm(backup, { force: true }).catch(() => undefined);
}

function catalogPath() {
  return join(app.getPath("userData"), "catalog", "cards.sqlite");
}

function catalogUrl(path: string) {
  return new URL(path, `${apiBaseUrl.replace(/\/+$/, "")}/`).toString();
}

function sendProgress(event: IpcMainInvokeEvent, progress: CatalogProgress) {
  if (!event.sender.isDestroyed()) {
    event.sender.send("catalog:progress", progress);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
