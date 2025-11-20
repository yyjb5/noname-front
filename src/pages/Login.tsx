import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import "./login.css";

function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: "/game", replace: true });
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      await login(username, password);
      router.navigate({ to: "/game", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
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
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "正在登录…" : "登录"}
          </button>
        </form>
        <p className="login-hint">
          账号信息会发送到后端验证，请使用已注册的凭证。
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
