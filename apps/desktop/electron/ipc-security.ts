import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { app, type IpcMainInvokeEvent } from "electron";

export function assertTrustedSender(event: IpcMainInvokeEvent) {
  const senderFrame = event.senderFrame;

  if (!senderFrame || senderFrame !== event.sender.mainFrame) {
    throw new Error("Untrusted desktop request.");
  }

  const senderUrl = new URL(senderFrame.url);
  const developmentUrl = developmentRendererUrl();

  if (developmentUrl) {
    if (senderUrl.origin === developmentUrl.origin) {
      return;
    }
  } else {
    senderUrl.hash = "";
    senderUrl.search = "";

    if (senderUrl.href === pathToFileURL(join(app.getAppPath(), "dist/index.html")).href) {
      return;
    }
  }

  throw new Error("Untrusted desktop request.");
}

export function developmentRendererUrl() {
  if (app.isPackaged || !process.env.VITE_DEV_SERVER_URL) {
    return null;
  }

  try {
    const url = new URL(process.env.VITE_DEV_SERVER_URL);
    if (url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
      return url;
    }
  } catch {
    // The development URL is untrusted configuration.
  }

  return null;
}
