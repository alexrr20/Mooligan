import { Hono } from "hono";
import { cors } from "hono/cors";

const api = new Hono();

api.use("*", cors());

api.get("/health", (context) => context.json({ status: "ok" as const }));

export default api;
