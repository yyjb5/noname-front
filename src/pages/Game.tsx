import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import "./game.css";

const mountUrl = `${import.meta.env.BASE_URL}noname/index.html`;

function GamePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);

  const iframeSrc = useMemo(
    () => new URL(mountUrl, window.location.origin).toString(),
    []
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.navigate({ to: "/", replace: true });
    }
  }, [isAuthenticated, router]);

  return (
    <div className="game-shell">
      {!ready && <div className="game-loader">正在加载无名杀，请稍候…</div>}
      <iframe
        className={`game-frame${ready ? " is-ready" : ""}`}
        src={iframeSrc}
        allowFullScreen
        title="noname"
        onLoad={() => setReady(true)}
      />
    </div>
  );
}

export default GamePage;
