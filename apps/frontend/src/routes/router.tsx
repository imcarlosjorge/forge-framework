import { createBrowserRouter } from "react-router-dom";
import { Home } from "../pages/Home";
import type { JSX } from "react";

export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter([{ path: "/", element: (<Home />) as JSX.Element }]);
