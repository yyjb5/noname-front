import { useState, useEffect } from 'react';
import { httpCache } from '../utils/httpCache';

interface HttpCacheStatusProps {
  embedded?: boolean;
  onClose?: () => void;
}

export function HttpCacheStatus({ embedded = false, onClose }: HttpCacheStatusProps) {
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 检查HTTP缓存状态
    const checkHttpCacheStatus = () => {
      try {
        const stats = httpCache.getCacheStats();
        setCacheInfo(stats);
      } catch (error) {
        console.error('HTTP缓存检查失败:', error);
      }
    };

    // 定期更新缓存状态
    checkHttpCacheStatus();
    const interval = setInterval(checkHttpCacheStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const clearCache = () => {
    if (confirm('确定要清除所有缓存吗？')) {
      httpCache.clearAllCache();
      setCacheInfo(null);
    }
  };

  // When embedded into the floating menu, always render the full panel (no floating indicator)
  if (embedded) {
    return (
      <div className="cache-panel-inner">
        <div className="cache-header">
          <h4>📦 HTTP缓存状态</h4>
          <button onClick={() => onClose ? onClose() : setIsVisible(false)}>×</button>
        </div>

        <div className="cache-info">
          <div className="cache-stat">
            <span>缓存文件数量:</span>
            <span>{cacheInfo?.count ?? '-'}</span>
          </div>
          <div className="cache-stat">
            <span>缓存大小:</span>
            <span>{cacheInfo?.size ?? '-'}</span>
          </div>
          <div className="cache-stat">
            <span>离线可用:</span>
            <span className="cache-available">✅ 是</span>
          </div>
          <div className="cache-stat">
            <span>缓存方式:</span>
            <span className="cache-type">localStorage</span>
          </div>
        </div>

        <div className="cache-actions">
          <button onClick={clearCache} className="cache-btn clear">
            清除缓存
          </button>
          <button onClick={() => onClose ? onClose() : setIsVisible(false)} className="cache-btn close">
            关闭
          </button>
        </div>

        {cacheInfo?.items?.length > 0 && (
          <div className="cache-details">
            <h5>最近缓存文件:</h5>
            <ul>
              {cacheInfo.items.map((item: any, index: number) => (
                <li key={index} title={item.url}>
                  {item.url.split('/').pop()}
                  <small>({Math.round(item.size / 1024)}KB)</small>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="cache-note">
          <small>
            💡 HTTP缓存适用于IP部署环境，缓存存储在浏览器本地
          </small>
        </div>
      </div>
    );
  }

  if (!cacheInfo || !isVisible) {
    return (
      <div
        className="cache-status-indicator http-cache"
        onClick={() => setIsVisible(!isVisible)}
        title="点击查看HTTP缓存状态"
      >
        💾
      </div>
    );
  }

  return (
    <div className="cache-status-panel http-cache-panel">
      <div className="cache-header">
        <h4>📦 HTTP缓存状态</h4>
        <button onClick={() => setIsVisible(false)}>×</button>
      </div>

      <div className="cache-info">
        <div className="cache-stat">
          <span>缓存文件数量:</span>
          <span>{cacheInfo.count}</span>
        </div>
        <div className="cache-stat">
          <span>缓存大小:</span>
          <span>{cacheInfo.size}</span>
        </div>
        <div className="cache-stat">
          <span>离线可用:</span>
          <span className="cache-available">✅ 是</span>
        </div>
        <div className="cache-stat">
          <span>缓存方式:</span>
          <span className="cache-type">localStorage</span>
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

      {cacheInfo.items.length > 0 && (
        <div className="cache-details">
          <h5>最近缓存文件:</h5>
          <ul>
            {cacheInfo.items.map((item: any, index: number) => (
              <li key={index} title={item.url}>
                {item.url.split('/').pop()}
                <small>({Math.round(item.size / 1024)}KB)</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="cache-note">
        <small>
          💡 HTTP缓存适用于IP部署环境，缓存存储在浏览器本地
        </small>
      </div>
    </div>
  );
}