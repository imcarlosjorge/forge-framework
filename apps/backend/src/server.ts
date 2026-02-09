// AQUI ELE PEGA TYPESCRIPT já compilado, por isso está em JS
// NÃO ALTERE
import { app } from "./app.config.js";
import { healthRoutes } from "./routes/health.js";
import dotenv from 'dotenv';
dotenv.config();

//CRIAR CORS

async function main() {
    try {
        // registra rotas
        await healthRoutes(app);

        // pega a porta do .env
        const portEnv = process.env.PORT;

        if (!portEnv) {
            console.error("Erro: a variável de ambiente PORT não está definida. O servidor não vai iniciar.");
            process.exit(1); // encerra o processo sem subir
        }

        const port = Number(portEnv);

        // start do servidor
        await app.listen({ port });
        console.log(`Server running on http://localhost:${port}`);
    } catch (err) {
        console.error("Não foi possível iniciar o servidor:", err);
        process.exit(1);
    }
}

main();
