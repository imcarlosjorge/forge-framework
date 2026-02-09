// app/routes/router.tsx
// Regra: não se cria rota fora desse arquivo
import { createBrowserRouter } from "react-router-dom";
import { Home } from "../pages/Home";

export const router = createBrowserRouter([
    { path: "/", element: <Home /> }
]);
