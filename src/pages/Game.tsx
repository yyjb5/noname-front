import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import { PWAInstallPrompt } from "../components/PWAInstallPrompt";
import { FloatingMenu } from "../components/FloatingMenu";
// CacheStatus intentionally not imported here; caching UI moved into FloatingMenu
import "../App.css";
import "./game.css";

const mountUrl = `${import.meta.env.BASE_URL}noname/index.html`;

function GamePage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const [iframeReady, setIframeReady] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.navigate({ to: "/", replace: true });
    }
  }, [isAuthenticated, router]);

  // PWA安装提示
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone && 'serviceWorker' in navigator) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // 注册Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/" });
  };

  return (
    <>
      {/* 悬浮菜单 - 唯一的控制界面 */}
      <FloatingMenu onLogout={handleLogout} />

      {/* 缓存状态指示器 */}
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
          src={mountUrl}
          title="无名杀"
          className={`game-iframe${iframeReady ? " is-ready" : ""}`}
          allowFullScreen
        />
      </div>
    </>
  );
}

export default GamePage;
