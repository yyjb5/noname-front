import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import LoginPage from "./pages/Login";
import GamePage from "./pages/Game";
import "./styles/layout.css";
import { useAuth } from "./context/AuthContext";

const RootRoute = createRootRoute({
  component: RootLayout,
});

const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: LoginPage,
});

const GameRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "game",
  component: GamePage,
});

const routeTree = RootRoute.addChildren([IndexRoute, GameRoute]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}

function RootLayout(): ReactNode {
  const { isAuthenticated } = useAuth();

  return (
    <div className={isAuthenticated ? "shell shell--auth" : "shell shell--guest"}>
      <main className="shell__body">
        <Outlet />
      </main>
    </div>
  );
}
