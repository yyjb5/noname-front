import { useState, useRef, useEffect } from 'react';

interface FullScreenGameProps {
  src: string;
  onClose: () => void;
}

export function FullScreenGame({ src, onClose }: FullScreenGameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="fullscreen-overlay">
      <div className="fullscreen-header">
        <span>按 ESC 退出全屏</span>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      {isLoading && (
        <div className="fullscreen-loading">
          <div className="loading-spinner"></div>
          <p>正在加载游戏...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={src}
        className="fullscreen-iframe"
        onLoad={handleIframeLoad}
        title="无名杀全屏模式"
        allowFullScreen
      />
    </div>
  );
}