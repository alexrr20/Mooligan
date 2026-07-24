import assert from "node:assert/strict";
import test from "node:test";

import { buildApi } from "../src/app.ts";

void test("GET /health reports a CORS-enabled healthy service", async (context) => {
  const api = buildApi();
  context.after(() => api.close());

  const response = await api.inject({
    method: "GET",
    url: "/health",
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"] ?? "", /^application\/json/);
  assert.deepEqual(response.json(), { status: "ok" });
  assert.equal(response.headers["access-control-allow-origin"], "*");
});
