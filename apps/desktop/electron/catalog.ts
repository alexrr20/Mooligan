import { mkdir, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";

import { CatalogSnapshotSchema, type CatalogSnapshot } from "@mooligan/domain/catalog";
import { CatalogReleaseSchema, type CatalogRelease } from "@mooligan/domain/catalog-sync";
import { app, ipcMain, net, type IpcMainInvokeEvent } from "electron";

import { recoverInterruptedReplacement } from "./catalog-files";
import { importCatalog, readGzipJsonLines } from "./catalog-import";

export type CatalogProgress = {
  completedBytes: number;
  completedCards: number;
  totalBytes: number;
};

export type CatalogStatus =
  | { installed: false }
  | (CatalogSnapshot & { installed: true; updateAvailable: boolean });

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

  let installed: CatalogSnapshot;

  try {
    const database = new DatabaseSync(path, { readOnly: true });

    try {
      const row = database
        .prepare(
          "SELECT card_count AS cardCount, updated_at AS updatedAt FROM catalog_meta WHERE singleton = 1",
        )
        .get();

      const snapshot = CatalogSnapshotSchema.safeParse(row);

      if (!snapshot.success) {
        return { installed: false };
      }

      installed = snapshot.data;
    } finally {
      database.close();
    }
  } catch {
    return { installed: false };
  }

  try {
    const latest = await fetchCatalogRelease();

    return {
      installed: true,
      updateAvailable: latest.updatedAt !== installed.updatedAt,
      ...installed,
    };
  } catch {
    return { installed: true, updateAvailable: false, ...installed };
  }
}

async function downloadCatalog(event: IpcMainInvokeEvent): Promise<CatalogStatus> {
  const release = await fetchCatalogRelease();

  const destination = catalogPath();
  const partial = `${destination}.part`;
  const backup = `${destination}.previous`;

  await mkdir(join(app.getPath("userData"), "catalog"), { recursive: true });
  await rm(partial, { force: true });

  sendProgress(event, {
    completedBytes: 0,
    completedCards: 0,
    totalBytes: release.compressedSize,
  });

  try {
    const response = await net.fetch(release.downloadUrl, {
      headers: { Accept: "application/gzip,application/octet-stream;q=0.9,*/*;q=0.8" },
    });

    if (!response.ok || !response.body) {
      throw new Error(`The card download returned HTTP ${response.status}.`);
    }

    let completedBytes = 0;
    let completedCards = 0;
    let lastReportedBytes = 0;
    const reportProgress = () => {
      sendProgress(event, {
        completedBytes,
        completedCards,
        totalBytes: release.compressedSize,
      });
    };
    const monitored = response.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          completedBytes += chunk.byteLength;

          if (
            completedBytes === release.compressedSize ||
            completedBytes - lastReportedBytes >= 1024 * 1024
          ) {
            lastReportedBytes = completedBytes;
            reportProgress();
          }

          controller.enqueue(chunk);
        },
      }),
    );
    const lines = readGzipJsonLines(Readable.from(monitored));
    const snapshot = await importCatalog(partial, release, lines, (count) => {
      completedCards = count;
      reportProgress();
    });

    if (completedBytes !== release.compressedSize) {
      throw new Error("The card download was incomplete.");
    }

    await replaceCatalog(partial, destination, backup);
    return { installed: true, updateAvailable: false, ...snapshot };
  } catch (error) {
    await rm(partial, { force: true });
    throw error;
  }
}

async function fetchCatalogRelease(): Promise<CatalogRelease> {
  const response = await net.fetch(catalogUrl("catalog/release"));

  if (!response.ok) {
    throw new Error(
      response.status === 503
        ? "The card catalog release has not been published yet."
        : `The catalog service returned HTTP ${response.status}.`,
    );
  }

  const release = CatalogReleaseSchema.safeParse(await response.json());

  if (!release.success) {
    throw new Error("The catalog service returned an invalid release.");
  }

  return release.data;
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
