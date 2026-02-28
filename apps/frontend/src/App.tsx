import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router";
import type { JSX } from "react";

export function App(): JSX.Element {
  return <RouterProvider router={router} />;
}
