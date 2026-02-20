// apps/frontend/src/routes/router.tsx
import { createBrowserRouter } from "react-router-dom";
import { Home } from "../pages/Home";   // Se Home é .tsx, não precisa colocar extensão
import { Login } from "../pages/Login"; // Se Login é .tsx, não precisa colocar extensão

// Criação do router do app
export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
]);