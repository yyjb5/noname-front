import { useState, useEffect } from 'react';

interface PWAInstallPromptProps {
  onClose: () => void;
}

export function PWAInstallPrompt({ onClose }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsSupported(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
      onClose();
    }
  };

  const handleManualInstall = () => {
    // 显示手动安装说明
    alert(`
      安装无名杀PWA应用：

      Chrome/Edge:
      1. 点击地址栏右侧的下载图标 ⬇️
      2. 选择"安装应用"

      Safari:
      1. 点击分享按钮 📤
      2. 滑动并选择"添加到主屏幕"
    `);
  };

  if (!isSupported && !deferredPrompt) {
    return (
      <div className="pwa-prompt">
        <div className="pwa-content">
          <h4>📱 安离线缓存</h4>
          <p>安装应用以节省流量，支持离线游戏</p>
          <div className="pwa-actions">
            <button onClick={handleManualInstall} className="pwa-btn primary">
              了解如何安装
            </button>
            <button onClick={onClose} className="pwa-btn secondary">
              暂不安装
            </button>
          </div>
        </div>
        <button onClick={onClose} className="pwa-close">×</button>
      </div>
    );
  }

  return (
    <div className="pwa-prompt">
      <div className="pwa-content">
        <h4>📱 安装无名杀</h4>
        <p>安装后可离线游戏，节省大量流量</p>
        <div className="pwa-actions">
          <button onClick={handleInstall} className="pwa-btn primary">
            立即安装
          </button>
          <button onClick={onClose} className="pwa-btn secondary">
            稍后提醒
          </button>
        </div>
      </div>
      <button onClick={onClose} className="pwa-close">×</button>
    </div>
  );
}