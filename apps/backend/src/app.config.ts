import fastify from "fastify";
import type { FastifyInstance } from "fastify"; 

export const app: FastifyInstance = fastify({ logger: true });
