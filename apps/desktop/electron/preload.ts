import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

import type { CatalogProgress, CatalogStatus } from "./catalog";
import type { CatalogListRequest } from "./catalog-query";

contextBridge.exposeInMainWorld("catalog", {
  download: (): Promise<CatalogStatus> => ipcRenderer.invoke("catalog:download"),
  list: (request?: CatalogListRequest) => ipcRenderer.invoke("catalog:list", request),
  onProgress: (callback: (progress: CatalogProgress) => void) => {
    const listener = (_event: IpcRendererEvent, progress: CatalogProgress) => callback(progress);

    ipcRenderer.on("catalog:progress", listener);
    return () => ipcRenderer.off("catalog:progress", listener);
  },
  status: (): Promise<CatalogStatus> => ipcRenderer.invoke("catalog:status"),
});
