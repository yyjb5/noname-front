import { useState, useRef, useLayoutEffect } from 'react';
import { HttpCacheStatus } from './HttpCacheStatus';
import { CacheStatus } from './CacheStatus';

interface FloatingMenuProps {
  onLogout: () => void;
}

export function FloatingMenu({ onLogout }: FloatingMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCachePanel, setShowCachePanel] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const dragRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startPosEl = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  
  
  // 确保悬浮球不会超出屏幕边界 — 使用 useLayoutEffect 以避免 setState in effect lint 建议
  useLayoutEffect(() => {
    const maxX = window.innerWidth - (isExpanded ? 200 : 60);
    const maxY = window.innerHeight - (isExpanded ? 120 : 60);

    setPosition(curr => {
      const nx = Math.max(0, Math.min(curr.x, maxX));
      const ny = Math.max(0, Math.min(curr.y, maxY));
      if (nx === curr.x && ny === curr.y) return curr;
      return { x: nx, y: ny };
    });

    const handleResize = () => {
      const maxX2 = window.innerWidth - (isExpanded ? 200 : 60);
      const maxY2 = window.innerHeight - (isExpanded ? 120 : 60);
      setPosition(curr => {
        const nx = Math.max(0, Math.min(curr.x, maxX2));
        const ny = Math.max(0, Math.min(curr.y, maxY2));
        if (nx === curr.x && ny === curr.y) return curr;
        return { x: nx, y: ny };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);
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
            setIsExpanded(prev => {
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

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
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
    setShowCachePanel(prev => !prev);
  };

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

    window.addEventListener('pointerdown', handleOutside);
    return () => window.removeEventListener('pointerdown', handleOutside);
  }, [showCachePanel]);
  

  return (
    <>
    <div
      ref={dragRef}
      className={`floating-menu ${isExpanded ? 'expanded' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isExpanded ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        // Disable transitions while dragging so the element follows the pointer immediately
        transition: isDragging ? 'none' : 'all 0.12s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      title="设置 - 点击展开菜单，可拖拽移动"
    >
      {/* 悬浮球主按钮 */}
      <div className="floating-ball" onPointerDown={handlePointerDown}>
        <div className="ball-icon">
          {isExpanded ? '✕' : '⚙️'}
        </div>
      </div>

      {/* 展开的菜单项 */}
      {isExpanded && (
        <div className="menu-items">
          <div className="menu-item cache" onClick={(e) => { e.stopPropagation(); handleShowCache(); }}>
            <span className="menu-icon">💾</span>
            <span className="menu-text">缓存管理</span>
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
            <div className="cache-panel-content" ref={panelRef} onClick={(e) => e.stopPropagation()}>
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