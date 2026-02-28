import fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
// import cookie from "@fastify/cookie"; // opcional

export const app: FastifyInstance = fastify({ logger: true });

function getJwtSecret(): string {
  const jwtSecret: string | undefined = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET não está definido! Adicione no arquivo .env e reinicie o servidor.",
    );
  }

  return jwtSecret;
}

const jwtSecret: string = getJwtSecret();

// Função para registrar plugins
async function registerPlugins(): Promise<void> {
  await app.register(cors, {
    origin: "*", // mude para origens específicas em PRODUÇÃO!
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // credentials: true, // se usar cookies
  });

  // Registra o JWT (ESSENCIAL)
  await app.register(jwt, {
    secret: jwtSecret, // aqui já é string garantido
    sign: {
      expiresIn: "1h",
    },
  });

  // Aqui você pode adicionar mais plugins no futuro
}

export { registerPlugins };
