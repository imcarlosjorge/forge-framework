export const routes = {
    healthRoute: async (app) => {
        app.get("/health", async () => {
            return { status: "ok" };
        });
    },
    initialRoute: async (app) => {
        app.get("/", async () => {
            return { status: "ok", name: "Machado" };
        });
    }
};
//# sourceMappingURL=routes.js.map