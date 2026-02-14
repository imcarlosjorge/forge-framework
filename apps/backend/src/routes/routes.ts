import type { FastifyInstance } from "fastify";

export const routes = {
  healthRoute: async (app: FastifyInstance) => {
    app.get("/health", async () => {
      return { status: "ok" };
    })
  },
  initialRoute: async (app: FastifyInstance) => {
    app.get("/", async() =>{
      return { status: "ok", name: "Machado" };
    })
  }

}