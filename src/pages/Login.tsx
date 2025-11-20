import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import "./login.css";

function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: "/game", replace: true });
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login();
    router.navigate({ to: "/game", replace: true });
  };

  return (
    <div className="login-page">
      <section className="login-panel">
        <header>
          <h1>无名杀控制台</h1>
          <p>请输入账户信息进入游戏预览。</p>
        </header>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>账户</span>
            <input
              name="username"
              placeholder="admin"
              autoComplete="username"
              required
            />
          </label>
          <label>
            <span>密码</span>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit">登录</button>
        </form>
        <p className="login-hint">此登录仅用于演示，不会校验真实账号。</p>
      </section>
    </div>
  );
}

export default LoginPage;
