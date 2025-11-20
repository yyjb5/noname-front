import { useMemo, useState } from "react";
import "./App.css";

const mountUrl = `${import.meta.env.BASE_URL}noname/index.html`;

function App() {
  const [embedded, setEmbedded] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);

  const iframeSrc = useMemo(() => mountUrl, []);

  const toggleEmbedded = () => {
    setEmbedded((prev) => {
      const next = !prev;
      if (next) {
        setIframeReady(false);
      }
      return next;
    });
  };

  return (
    <div className="app-shell">
      <header className="shell-header">
        <div>
          <h1>React Shell for 无名杀</h1>
          <p>
            本项目使用 Vite 打包并托管 <code>noname</code> 子模块的静态资源。
            默认以内嵌窗口预览，可点击按钮在新标签页打开原生页面。
          </p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={toggleEmbedded}>
            {embedded ? "隐藏内嵌窗口" : "显示内嵌窗口"}
          </button>
          <button
            type="button"
            onClick={() => window.open(iframeSrc, "_blank", "noopener")}
          >
            在新标签中打开无名杀
          </button>
        </div>
      </header>
      {embedded ? (
        <section className="preview-panel">
          {!iframeReady && (
            <div className="loading-hint">正在加载无名杀资源…</div>
          )}
          <iframe
            onLoad={() => setIframeReady(true)}
            src={iframeSrc}
            title="noname"
            className={`game-frame${iframeReady ? " is-ready" : ""}`}
            allowFullScreen
          />
        </section>
      ) : (
        <section className="preview-placeholder">
          <p>内嵌窗口已关闭。使用上方按钮重新显示或在新标签页打开。</p>
        </section>
      )}
    </div>
  );
}

export default App;
