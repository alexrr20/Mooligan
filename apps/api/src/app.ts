import Fastify from "fastify";

export function buildApi() {
  const api = Fastify();

  api.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            required: ["status"],
            properties: {
              status: { type: "string", const: "ok" },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      reply.header("Access-Control-Allow-Origin", "*");
      return { status: "ok" } as const;
    },
  );

  return api;
}
