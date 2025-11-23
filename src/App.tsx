import { useState, useEffect } from "react";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { FloatingMenu } from "./components/FloatingMenu";
// CacheStatus intentionally not imported here; caching UI moved into FloatingMenu
import "./App.css";

const mountUrlBase = `${import.meta.env.BASE_URL}noname/index.html`;

function App() {
  const [iframeReady, setIframeReady] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // PWA安装提示
  useEffect(() => {
    // 检查是否已安装为PWA
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    if (!isStandalone) {
      // 延迟显示安装提示
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogout = () => {
    if (confirm("确定要退出登录吗？")) {
      console.log("用户退出登录");
      window.location.reload();
    }
  };

  // Compute iframe src at runtime: if not secure context (no HTTPS and not localhost),
  // add `?static=1` so the embedded game runs in static mode and won't prompt about serviceWorker.
  const [iframeSrc] = useState(() => {
    try {
      const isLocalhost =
        typeof location !== "undefined" &&
        (location.hostname === "localhost" ||
          location.hostname === "127.0.0.1");
      const secure =
        (typeof window !== "undefined" && !!window.isSecureContext) ||
        (typeof location !== "undefined" && location.protocol === "https:") ||
        isLocalhost;
      if (!secure) {
        return mountUrlBase.includes("?")
          ? mountUrlBase + "&static=1"
          : mountUrlBase + "?static=1";
      }
    } catch {
      // ignore
    }
    return mountUrlBase;
  });

  return (
    <>
      {/* 按钮和游戏都放到同一个 wrapper，这样我们可以对 wrapper 请求全屏并保持悬浮 UI 在全屏中可见 */}
      <div className="app-fullscreen-wrapper">
        {/* 悬浮菜单 - 唯一的控制界面 */}
        <FloatingMenu onLogout={handleLogout} />

        {/* 缓存状态指示器 (已移动到 FloatingMenu 内部) */}
        {/* CacheStatus removed here to avoid duplicate UI; use FloatingMenu -> Cache panel instead */}

        {/* PWA安装提示 */}
        {showInstallPrompt && (
          <PWAInstallPrompt onClose={() => setShowInstallPrompt(false)} />
        )}

        {/* 纯游戏界面 - 占满全屏 */}
        <div className="game-container">
          {!iframeReady && (
            <div className="game-loading">
              <div className="loading-spinner"></div>
              <div className="loading-text">
                <h2>🎮 无名杀</h2>
                <p>正在加载游戏资源，支持离线缓存...</p>
                <small>首次加载可能较慢，之后可离线游戏</small>
              </div>
            </div>
          )}
          <iframe
            onLoad={() => setIframeReady(true)}
            src={iframeSrc}
            title="无名杀"
            className={`game-iframe${iframeReady ? " is-ready" : ""}`}
            allowFullScreen
          />
        </div>
      </div>
    </>
  );
}

export default App;
