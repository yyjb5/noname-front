import { useState, useEffect } from "react";

interface CacheStatusProps {
  embedded?: boolean;
  onClose?: () => void;
}

export function CacheStatus({ embedded = false, onClose }: CacheStatusProps) {
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 检查缓存状态
    const checkCacheStatus = async () => {
      if ("caches" in window) {
        try {
          const cacheNames = await caches.keys();
          const nonameCache = cacheNames.find((name) =>
            name.includes("noname")
          );

          if (nonameCache) {
            const cache = await caches.open(nonameCache);
            const keys = await cache.keys();
            const requests = keys.map((key) => key.url);

            // 计算缓存大小（粗略估算）
            let totalSize = 0;
            for (const request of requests) {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
              }
            }

            setCacheInfo({
              name: nonameCache,
              count: keys.length,
              size: totalSize,
              sizeFormatted: formatFileSize(totalSize),
              requests: requests.slice(0, 10), // 只显示前10个
            });
          }
        } catch (error) {
          console.error("Cache check failed:", error);
        }
      }
    };

    // 延迟检查，让缓存有时间建立
    const timer = setTimeout(checkCacheStatus, 5000);
    return () => clearTimeout(timer);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const clearCache = async () => {
    if ("caches" in window && cacheInfo) {
      try {
        await caches.delete(cacheInfo.name);
        setCacheInfo(null);
        alert("缓存已清除！刷新页面后将重新下载游戏资源。");
      } catch (error) {
        console.error("Failed to clear cache:", error);
      }
    }
  };

  if (embedded) {
    return (
      <div className="cache-panel-inner">
        <div className="cache-header">
          <h4>📦 缓存状态</h4>
          <button onClick={() => (onClose ? onClose() : setIsVisible(false))}>
            ×
          </button>
        </div>

        <div className="cache-info">
          <div className="cache-stat">
            <span>缓存文件数量:</span>
            <span>{cacheInfo?.count ?? "-"}</span>
          </div>
          <div className="cache-stat">
            <span>缓存大小:</span>
            <span>{cacheInfo?.sizeFormatted ?? "-"}</span>
          </div>
          <div className="cache-stat">
            <span>离线可用:</span>
            <span className="cache-available">✅ 是</span>
          </div>
        </div>

        <div className="cache-actions">
          <button onClick={clearCache} className="cache-btn clear">
            清除缓存
          </button>
          <button
            onClick={() => (onClose ? onClose() : setIsVisible(false))}
            className="cache-btn close"
          >
            关闭
          </button>
        </div>

        <div className="cache-details">
          <h5>最近缓存文件:</h5>
          <ul>
            {(cacheInfo?.requests ?? [])
              .slice(0, 5)
              .map((url: string, index: number) => (
                <li key={index} title={url}>
                  {url.split("/").pop()}
                </li>
              ))}
          </ul>
        </div>
      </div>
    );
  }

  if (!cacheInfo || !isVisible) {
    return (
      <div
        className="cache-status-indicator"
        onClick={() => setIsVisible(!isVisible)}
        title="点击查看缓存状态"
      >
        💾
      </div>
    );
  }

  return (
    <div className="cache-status-panel">
      <div className="cache-header">
        <h4>📦 缓存状态</h4>
        <button onClick={() => setIsVisible(false)}>×</button>
      </div>

      <div className="cache-info">
        <div className="cache-stat">
          <span>缓存文件数量:</span>
          <span>{cacheInfo.count}</span>
        </div>
        <div className="cache-stat">
          <span>缓存大小:</span>
          <span>{cacheInfo.sizeFormatted}</span>
        </div>
        <div className="cache-stat">
          <span>离线可用:</span>
          <span className="cache-available">✅ 是</span>
        </div>
      </div>

      <div className="cache-actions">
        <button onClick={clearCache} className="cache-btn clear">
          清除缓存
        </button>
        <button onClick={() => setIsVisible(false)} className="cache-btn close">
          关闭
        </button>
      </div>

      <div className="cache-details">
        <h5>最近缓存文件:</h5>
        <ul>
          {cacheInfo.requests.slice(0, 5).map((url: string, index: number) => (
            <li key={index} title={url}>
              {url.split("/").pop()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
