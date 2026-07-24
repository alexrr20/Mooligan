import { buildApi } from "./app.ts";

const api = buildApi();

try {
  await api.listen({ host: "127.0.0.1", port: 3000 });
} catch (error) {
  process.stderr.write(`Failed to start API: ${String(error)}\n`);
  process.exitCode = 1;
}
