import assert from "node:assert/strict";
import { test } from "vite-plus/test";

import api from "../src/index.ts";

test("GET /health reports a CORS-enabled healthy service", async () => {
  const response = await api.request("http://localhost/health");

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json/);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
});
