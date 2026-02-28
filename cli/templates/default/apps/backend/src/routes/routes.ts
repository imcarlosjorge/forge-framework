import type { FastifyInstance } from "fastify";
import type { Routes, InitialResponse } from "../types/routes.ts";

export const routes: Routes = {
  initialRoute: async (app: FastifyInstance): Promise<void> => {
    app.get("/", async (): Promise<InitialResponse> => {
      return { status: "ok" };
    });
  },
};
