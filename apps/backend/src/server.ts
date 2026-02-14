// AQUI ELE PEGA TYPESCRIPT já compilado, por isso está em JS
// NÃO ALTERE
import { app, registerPlugins } from "./app.config.js";
import { routes } from "./routes/routes.js";
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    try {
        await registerPlugins();

        // registra rotas
        await routes.healthRoute(app);
        await routes.initialRoute(app);

        // pega a porta do .env
        const portEnv = process.env.PORT;

        if (!portEnv) {
            console.error("Erro: a variável de ambiente PORT não está definida. O servidor não vai iniciar.");
            process.exit(1); // encerra o processo sem subir
        };

        const port = Number(portEnv);

        // start do servidor
        await app.listen({ port });
        console.log(`Server running!!!`);
    } catch (err) {
        console.error("Não foi possível iniciar o servidor:", err);
        process.exit(1);
    }
}

main();
