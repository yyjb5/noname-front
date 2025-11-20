/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface AuthContextValue {
  isAuthenticated: boolean;
  username?: string;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthSnapshot {
  isAuthenticated: boolean;
  username?: string;
}

const STORAGE_KEY = "noname-auth-data";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
  /\/+$/,
  ""
);

const AuthContext = createContext<AuthContextValue | null>(null);

function readPersistedAuth(): AuthSnapshot {
  if (typeof window === "undefined") {
    return { isAuthenticated: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { isAuthenticated: false };
    }
    const parsed = JSON.parse(raw) as AuthSnapshot;
    if (parsed && typeof parsed.isAuthenticated === "boolean") {
      return parsed;
    }
  } catch {
    /* ignore corrupted storage */
  }
  return { isAuthenticated: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthSnapshot>(readPersistedAuth);

  const persistAuth = useCallback((state: AuthSnapshot) => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      if (state.isAuthenticated) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
          signal: controller.signal,
        });
        if (!response.ok) {
          let message = "登录失败";
          try {
            const data = await response.json();
            if (typeof data?.detail === "string") {
              message = data.detail;
            }
          } catch {
            /* ignore parse errors */
          }
          throw new Error(message);
        }

        const nextState: AuthSnapshot = { isAuthenticated: true, username };
        setAuthState(nextState);
        persistAuth(nextState);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error("登录请求超时");
        }
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("登录失败");
      } finally {
        window.clearTimeout(timeout);
      }
    },
    [persistAuth]
  );

  const logout = useCallback(() => {
    const nextState: AuthSnapshot = { isAuthenticated: false };
    setAuthState(nextState);
    persistAuth(nextState);
  }, [persistAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: authState.isAuthenticated,
      username: authState.username,
      login,
      logout,
    }),
    [authState, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
