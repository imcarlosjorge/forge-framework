console.log("DEBUG PORT:", process.env.PORT);

import { app, registerPlugins } from "./app.config.js";
import { routes } from "./routes/routes.js";

async function main(): Promise<void> {
  try {
    await registerPlugins();

    // registra rotas
    await routes.initialRoute(app);

    // pega a porta do env (flag do Forge ou .env)
    const rawPort: string | undefined = process.env.PORT;

    const port: number =
      rawPort && !Number.isNaN(Number(rawPort)) ? Number(rawPort) : 3333;

    console.log("🔎 PORT efetiva usada:", port);

    // start do servidor
    await app.listen({ port });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    console.error("Não foi possível iniciar o servidor:", err);
    process.exit(1);
  }
}

void main();
