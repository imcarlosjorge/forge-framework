import fastify from "fastify";
import cors from "@fastify/cors";
import jwt from '@fastify/jwt';
// import cookie from '@fastify/cookie'; // opcional
import type { FastifyInstance } from "fastify";

export const app: FastifyInstance = fastify({ logger: true });

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error(
        'JWT_SECRET não está definido! Adicione no arquivo .env e reinicie o servidor.'
    );
};

// Função para registrar plugins
async function registerPlugins() {

    // Register @fastify/cors
    await app.register(cors, {
        origin: "*", // mude para origens específicas em produção!
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        // credentials: true, // se usar cookies
    });

    // Registra o JWT (ESSENCIAL)
    // Talvez configurar JWT e testar
    await app.register(jwt, {
        secret: jwtSecret!, // o ! diz pro TS: "confia em mim, não é undefined"
        sign: {
            expiresIn: '1h',
        },
        // cookie: {  // opcional: armazena token em cookie httpOnly + secure
        //   signed: true,
        // },
    });

    // Aqui você pode adicionar mais plugins no futuro
}

export { registerPlugins };