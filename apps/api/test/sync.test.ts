import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { env, exports } from "cloudflare:workers";
import { makeSignature } from "better-auth/crypto";
import { v7 as uuidv7, version as uuidVersion } from "uuid";
// oxlint-disable-next-line vite-plus/prefer-vite-plus-imports -- Cloudflare's pool must share Vitest's runner instance.
import { test } from "vitest";

import { createAuth } from "../src/auth.ts";

test("sync routes require a Better Auth session", async () => {
  const responses = await Promise.all([
    request("/sync/workspace/bind", {
      body: { localWorkspaceId: randomUUID() },
      method: "POST",
    }),
    request("/sync/preferences"),
    request("/sync/preferences", {
      body: { updates: [{ key: "motion", value: "full" }] },
      method: "POST",
    }),
  ]);

  assert.deepEqual(
    responses.map(({ status }) => status),
    [401, 401, 401],
  );
});

test("binding creates one UUIDv7 workspace and merges without overwriting cloud data", async () => {
  const headers = await sessionHeaders();
  const first = await request("/sync/workspace/bind", {
    body: {
      localWorkspaceId: randomUUID(),
      preferences: { motion: "system" },
    },
    headers,
    method: "POST",
  });
  const firstBody = await first.json<BindResponse>();

  assert.equal(first.status, 200);
  assert.equal(uuidVersion(firstBody.workspaceId), 7);
  assertPreference(firstBody.preferences.motion, "system", 1);

  const second = await request("/sync/workspace/bind", {
    body: {
      localWorkspaceId: randomUUID(),
      preferences: { motion: "full" },
    },
    headers,
    method: "POST",
  });
  const secondBody = await second.json<BindResponse>();

  assert.equal(second.status, 200);
  assert.equal(secondBody.workspaceId, firstBody.workspaceId);
  assert.deepEqual(secondBody.preferences, firstBody.preferences);
});

test("the server versions and timestamps valid preference updates", async () => {
  const headers = await sessionHeaders();
  await request("/sync/workspace/bind", {
    body: { localWorkspaceId: randomUUID() },
    headers,
    method: "POST",
  });

  const first = await request("/sync/preferences", {
    body: { updates: [{ key: "motion", value: "full" }] },
    headers,
    method: "POST",
  });
  const firstBody = await first.json<PreferencesResponse>();

  assert.equal(first.status, 200);
  assertPreference(firstBody.preferences.motion, "full", 1);

  const second = await request("/sync/preferences", {
    body: { updates: [{ key: "motion", value: "reduced" }] },
    headers,
    method: "POST",
  });
  const secondBody = await second.json<PreferencesResponse>();

  assert.equal(second.status, 200);
  assertPreference(secondBody.preferences.motion, "reduced", 2);

  const concurrentResponses = await Promise.all([
    request("/sync/preferences", {
      body: { updates: [{ key: "motion", value: "full" }] },
      headers,
      method: "POST",
    }),
    request("/sync/preferences", {
      body: { updates: [{ key: "motion", value: "system" }] },
      headers,
      method: "POST",
    }),
  ]);
  const concurrentBodies = await Promise.all(
    concurrentResponses.map((response) => response.json<PreferencesResponse>()),
  );
  const versions = concurrentBodies
    .map(({ preferences }) => preferences.motion?.version)
    .sort((left, right) => (left ?? 0) - (right ?? 0));
  const winner = concurrentBodies.find(({ preferences }) => preferences.motion?.version === 4);

  assert.deepEqual(versions, [3, 4]);
  assert.ok(winner);

  const read = await request("/sync/preferences", { headers });
  assert.equal(read.status, 200);
  assert.deepEqual(await read.json(), winner);
});

test("sync input is strict and a local workspace cannot cross account ownership", async () => {
  const ownerHeaders = await sessionHeaders();
  const otherHeaders = await sessionHeaders();
  const localWorkspaceId = randomUUID();

  for (const body of [
    { localWorkspaceId: "not-a-uuid" },
    { localWorkspaceId, preferences: { motion: "sometimes" } },
    { extra: true, localWorkspaceId },
  ]) {
    const response = await request("/sync/workspace/bind", {
      body,
      headers: ownerHeaders,
      method: "POST",
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_request" });
  }

  assert.equal(
    (
      await request("/sync/workspace/bind", {
        body: { localWorkspaceId, preferences: { motion: "system" } },
        headers: ownerHeaders,
        method: "POST",
      })
    ).status,
    200,
  );

  const conflict = await request("/sync/workspace/bind", {
    body: { localWorkspaceId: localWorkspaceId.toUpperCase() },
    headers: otherHeaders,
    method: "POST",
  });
  assert.equal(conflict.status, 409);
  assert.deepEqual(await conflict.json(), { error: "workspace_bound_to_another_user" });

  const unbound = await request("/sync/preferences", { headers: otherHeaders });
  assert.equal(unbound.status, 404);
  assert.deepEqual(await unbound.json(), { error: "workspace_not_bound" });

  const invalidBodies = [
    { updates: [{ key: "motion", value: "sometimes" }] },
    { updates: [{ key: "language", value: "en" }] },
    { updates: [{ key: "motion", value: "full", version: 50 }] },
    { extra: true, updates: [{ key: "motion", value: "full" }] },
    { updates: [] },
  ];

  for (const body of invalidBodies) {
    const response = await request("/sync/preferences", {
      body,
      headers: ownerHeaders,
      method: "POST",
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "invalid_request" });
  }
});

test("sync mutations require JSON from the exact desktop origin", async () => {
  const headers = await sessionHeaders();
  const withoutDesktopOrigin = await request("/sync/workspace/bind", {
    body: { localWorkspaceId: randomUUID() },
    desktop: false,
    headers,
    method: "POST",
  });
  const textHeaders = new Headers(headers);
  textHeaders.set("content-type", "text/plain");
  textHeaders.set("electron-origin", "com.mooligan.app:/");
  const textBody = await exports.default.fetch(
    new Request("http://127.0.0.1:3000/sync/workspace/bind", {
      body: JSON.stringify({ localWorkspaceId: randomUUID() }),
      headers: textHeaders,
      method: "POST",
    }),
  );

  assert.equal(withoutDesktopOrigin.status, 403);
  assert.equal(textBody.status, 415);

  const oversized = await request("/sync/workspace/bind", {
    body: { localWorkspaceId: randomUUID(), padding: "x".repeat(17 * 1_024) },
    headers,
    method: "POST",
  });
  assert.equal(oversized.status, 413);
});

type Preference = {
  updatedAt: string;
  value: "full" | "reduced" | "system";
  version: number;
};

type PreferencesResponse = { preferences: { motion?: Preference } };
type BindResponse = PreferencesResponse & { workspaceId: string };

function assertPreference(
  preference: Preference | undefined,
  value: Preference["value"],
  version: number,
) {
  assert.ok(preference);
  assert.equal(preference.value, value);
  assert.equal(preference.version, version);
  assert.equal(new Date(preference.updatedAt).toISOString(), preference.updatedAt);
}

async function sessionHeaders() {
  const auth = await createAuth(env).$context;
  const user = await auth.internalAdapter.createUser({
    email: `${uuidv7()}@example.com`,
    emailVerified: true,
    name: "Sync Test User",
  });
  const session = await auth.internalAdapter.createSession(user.id);
  const signature = await makeSignature(session.token, env.BETTER_AUTH_SECRET);

  return new Headers({
    cookie: `better-auth.session_token=${session.token}.${signature}`,
  });
}

async function request(
  path: string,
  options: {
    body?: unknown;
    desktop?: boolean;
    headers?: Headers;
    method?: "GET" | "POST";
  } = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  let body: string | undefined;

  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }
  if (options.method === "POST" && options.desktop !== false) {
    headers.set("electron-origin", "com.mooligan.app:/");
  }

  return exports.default.fetch(
    new Request(`http://127.0.0.1:3000${path}`, {
      body,
      headers,
      method: options.method,
    }),
  );
}
