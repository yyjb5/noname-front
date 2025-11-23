import { useState, useRef, useLayoutEffect, type CSSProperties } from "react";
import { HttpCacheStatus } from "./HttpCacheStatus";
import { CacheStatus } from "./CacheStatus";

interface FloatingMenuProps {
  onLogout: () => void;
}

export function FloatingMenu({ onLogout }: FloatingMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCachePanel, setShowCachePanel] = useState(false);
  // landscape lock removed: we now only use fullscreen behavior
  const [forceLandscapeFallback, setForceLandscapeFallback] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const dragRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startPosEl = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  // 确保悬浮球不会超出屏幕边界 — 使用 useLayoutEffect 以避免 setState in effect lint 建议
  useLayoutEffect(() => {
    const effectiveWidth = forceLandscapeFallback
      ? window.innerHeight
      : window.innerWidth;
    const effectiveHeight = forceLandscapeFallback
      ? window.innerWidth
      : window.innerHeight;

    const maxX = effectiveWidth - (isExpanded ? 200 : 60);
    const maxY = effectiveHeight - (isExpanded ? 120 : 60);

    // compute clamped position and only update if changed; schedule via rAF to avoid synchronous setState in layout effect
    const clamped = (() => {
      const nx = Math.max(0, Math.min(position.x, maxX));
      const ny = Math.max(0, Math.min(position.y, maxY));
      return { x: nx, y: ny };
    })();

    if (clamped.x !== position.x || clamped.y !== position.y) {
      const raf = requestAnimationFrame(() => setPosition(clamped));
      return () => cancelAnimationFrame(raf);
    }

    const handleResize = () => {
      const ew = forceLandscapeFallback
        ? window.innerHeight
        : window.innerWidth;
      const eh = forceLandscapeFallback
        ? window.innerWidth
        : window.innerHeight;
      const maxX2 = ew - (isExpanded ? 200 : 60);
      const maxY2 = eh - (isExpanded ? 120 : 60);
      setPosition((curr) => {
        const nx = Math.max(0, Math.min(curr.x, maxX2));
        const ny = Math.max(0, Math.min(curr.y, maxY2));
        if (nx === curr.x && ny === curr.y) return curr;
        return { x: nx, y: ny };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded, forceLandscapeFallback, position.x, position.y]);
  // Unified pointer-based dragging (works for mouse and touch). Uses pointer capture so
  // the pointer is tracked even when it moves outside the element.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // allow dragging regardless of expanded state so the whole floating menu (and panel) can be moved
    e.preventDefault();
    e.stopPropagation();

    // capture the pointer on the current target so we keep receiving events
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore if not supported
    }

    startPos.current = { x: e.clientX, y: e.clientY };
    startPosEl.current = position;
    isDraggingRef.current = true;
    setIsDragging(true);

    const handlePointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = ev.clientX - startPos.current.x;
      const deltaY = ev.clientY - startPos.current.y;

      const maxX = window.innerWidth - (isExpanded ? 200 : 60);
      const maxY = window.innerHeight - (isExpanded ? 120 : 60);

      const newX = Math.max(0, Math.min(startPosEl.current.x + deltaX, maxX));
      const newY = Math.max(0, Math.min(startPosEl.current.y + deltaY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      isDraggingRef.current = false;
      setIsDragging(false);

      // release pointer capture
      try {
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }

      // 检查是否真的拖动了（防止误认为拖动）
      const dragDistance = Math.sqrt(
        Math.pow(upEvent.clientX - startPos.current.x, 2) +
          Math.pow(upEvent.clientY - startPos.current.y, 2)
      );

      // 如果拖动距离很小，则认为是点击
      if (dragDistance < 5) {
        setTimeout(() => {
          if (!isDraggingRef.current) {
            setIsExpanded((prev) => {
              const next = !prev;
              // if we're collapsing the menu, also hide the cache panel
              if (!next) {
                setShowCachePanel(false);
              }
              return next;
            });
          }
        }, 100);
      }

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Note: click handling is now done via pointerup small-move detection to avoid
  // accidental clicks after dragging; no separate handleClick is needed.

  const handleLogout = () => {
    setIsExpanded(false);
    onLogout();
  };

  const handleShowCache = () => {
    // Toggle cache panel; keep menu expanded
    setIsExpanded(true);
    setShowCachePanel((prev) => !prev);
  };

  // Position menu next to floating ball using fixed coordinates so transforms don't affect it
  const [menuStyle, setMenuStyle] = useState<Record<string, string | number>>(
    {}
  );

  const updateMenuPosition = () => {
    const btn = ballRef.current || dragRef.current;
    const menu = menuRef.current;
    if (!btn || !menu) return;
    const b = (btn as HTMLElement).getBoundingClientRect();
    const mw = Math.min(menu.offsetWidth || 380, window.innerWidth - 20);
    const mh = menu.offsetHeight || 200;
    let left = Math.round(b.right + 8);
    // try to vertically center the menu to the button
    let top = Math.round(b.top + (b.height - mh) / 2);
    // if would overflow right, place to left
    if (left + mw > window.innerWidth - 8) {
      left = Math.round(b.left - mw - 8);
    }
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    if (top + mh > window.innerHeight - 8) top = window.innerHeight - mh - 8;
    setMenuStyle({ left, top });
  };

  // Toggle fullscreen on the game container. We no longer attempt orientation lock or apply CSS rotation.
  const toggleLandscape = async () => {
    try {
      if (!document.fullscreenElement) {
        // Request fullscreen on the entire page (documentElement) so the whole page enters fullscreen
        if (typeof document.documentElement.requestFullscreen === "function") {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (typeof document.exitFullscreen === "function") {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
    // Reset any orientation fallback flag we might have set previously
    setForceLandscapeFallback(false);
  };

  // keep fullscreen state in sync
  useLayoutEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // When entering/exiting fullscreen, the viewport size changes — clamp the floating
  // ball position into the new viewport and update menu positioning so it stays visible.
  useLayoutEffect(() => {
    const handleFsChange = () => {
      // clamp position to current viewport
      const maxX = window.innerWidth - (isExpanded ? 200 : 60);
      const maxY = window.innerHeight - (isExpanded ? 120 : 60);
      setPosition((curr) => {
        const nx = Math.max(8, Math.min(curr.x, Math.max(8, maxX)));
        const ny = Math.max(8, Math.min(curr.y, Math.max(8, maxY)));
        if (nx === curr.x && ny === curr.y) return curr;
        return { x: nx, y: ny };
      });

      // update menu position after layout
      requestAnimationFrame(() => updateMenuPosition());
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, [isExpanded]);

  const handleHideCachePanel = () => {
    setShowCachePanel(false);
  };

  // Close cache panel when clicking/tapping outside the floating menu or panel
  // but don't interfere with dragging (pointer capture handles drag lifecycle).
  useLayoutEffect(() => {
    if (!showCachePanel) return;

    const handleOutside = (ev: PointerEvent) => {
      const target = ev.target as Node | null;
      if (!target) return;
      if (dragRef.current && dragRef.current.contains(target)) return;
      if (panelRef.current && panelRef.current.contains(target)) return;
      setShowCachePanel(false);
    };

    window.addEventListener("pointerdown", handleOutside);
    return () => window.removeEventListener("pointerdown", handleOutside);
  }, [showCachePanel]);

  // update menu position when expanded, when position changes, and on resize/orientation
  useLayoutEffect(() => {
    if (!isExpanded) return;
    // schedule after paint so menuRef has correct size
    const raf = requestAnimationFrame(() => updateMenuPosition());
    const onResize = () => updateMenuPosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [
    isExpanded,
    position.x,
    position.y,
    showCachePanel,
    forceLandscapeFallback,
  ]);

  const effectiveWidth = forceLandscapeFallback
    ? window.innerHeight
    : window.innerWidth;
  const isFlipped = position.x > effectiveWidth - 160;

  return (
    <>
      <div
        ref={dragRef}
        className={`floating-menu ${isExpanded ? "expanded" : ""} ${
          isFlipped ? "flip" : ""
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isExpanded ? "default" : isDragging ? "grabbing" : "grab",
          // Disable transitions while dragging so the element follows the pointer immediately
          transition: isDragging
            ? "none"
            : "all 0.12s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        title="设置 - 点击展开菜单，可拖拽移动"
      >
        {/* 悬浮球主按钮 */}
        <div
          className="floating-ball"
          onPointerDown={handlePointerDown}
          ref={ballRef}
        >
          <div className="ball-icon">{isExpanded ? "✕" : "⚙️"}</div>
        </div>

        {/* 展开的菜单项 */}
        {isExpanded && (
          <div
            className="menu-items"
            ref={menuRef}
            style={menuStyle as CSSProperties}
          >
            <div
              className="menu-item cache"
              onClick={(e) => {
                e.stopPropagation();
                handleShowCache();
              }}
            >
              <span className="menu-icon">💾</span>
              <span className="menu-text">缓存管理</span>
            </div>
            <div
              className="menu-item orientation"
              onClick={(e) => {
                e.stopPropagation();
                toggleLandscape();
              }}
            >
              <span className="menu-icon">🔃</span>
              <span className="menu-text">
                {isFullscreen ? "退出全屏" : "进入全屏"}
              </span>
            </div>
            <div
              className="menu-item logout"
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
            >
              <span className="menu-icon">🚪</span>
              <span className="menu-text">退出登录</span>
            </div>

            {/* 二级（侧边）面板：作为菜单项的子面板显示在右侧 */}
            {showCachePanel && (
              <div
                className="cache-panel-content"
                ref={panelRef}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cache-header">
                  <h4>📦 缓存管理</h4>
                  <button onClick={handleHideCachePanel}>×</button>
                </div>

                {/* HTTP缓存状态 */}
                <div className="cache-section">
                  <h5>HTTP缓存 (localStorage)</h5>
                  <HttpCacheStatus embedded onClose={handleHideCachePanel} />
                </div>

                {/* Service Worker缓存状态 */}
                <div className="cache-section">
                  <h5>Service Worker缓存</h5>
                  <CacheStatus embedded onClose={handleHideCachePanel} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
