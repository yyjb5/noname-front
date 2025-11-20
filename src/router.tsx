import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useRouter,
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
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/" });
  };

  return (
    <div
      className={isAuthenticated ? "shell shell--auth" : "shell shell--guest"}
    >
      {isAuthenticated ? (
        <>
          <header className="topbar">
            <span className="topbar__title">无名杀部署控制台</span>
            <button
              type="button"
              className="topbar__logout"
              onClick={handleLogout}
            >
              退出登录
            </button>
          </header>
          <main className="shell__body shell__body--auth">
            <Outlet />
          </main>
        </>
      ) : (
        <main className="shell__body shell__body--guest">
          <Outlet />
        </main>
      )}
    </div>
  );
}
