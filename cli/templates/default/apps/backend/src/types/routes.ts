import type { FastifyInstance } from "fastify";

export type InitialResponse = {
  status: string;
};

export type RouteHandler = (app: FastifyInstance) => Promise<void>;

export type Routes = {
  initialRoute: RouteHandler;
};
