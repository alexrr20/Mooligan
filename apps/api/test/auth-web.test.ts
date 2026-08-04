import assert from "node:assert/strict";

// oxlint-disable-next-line vite-plus/prefer-vite-plus-imports -- Cloudflare's pool requires its Vitest peer instance.
import { test } from "vitest";

import { parseElectronQuery } from "../auth-web/src/auth-query.ts";

test("the hosted sign-in page forwards only a complete Electron PKCE request", () => {
  const valid = new URLSearchParams({
    client_id: "electron",
    code_challenge: "challenge_123",
    code_challenge_method: "S256",
    ignored: "not-forwarded",
    state: "state-123",
  });

  assert.deepEqual(parseElectronQuery(valid), {
    client_id: "electron",
    code_challenge: "challenge_123",
    code_challenge_method: "S256",
    state: "state-123",
  });
  assert.equal(
    parseElectronQuery(new URLSearchParams({ ...Object.fromEntries(valid), state: "" })),
    null,
  );
  assert.equal(
    parseElectronQuery(
      new URLSearchParams({ ...Object.fromEntries(valid), code_challenge_method: "plain" }),
    ),
    null,
  );
});
