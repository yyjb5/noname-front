// HTTP部署环境的本地缓存工具
// 用于替代Service Worker，在没有HTTPS的环境下提供缓存功能

class HttpGameCache {
  private readonly CACHE_PREFIX = 'noname_cache_';
  private readonly CACHE_VERSION = 'v1';
  private readonly MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7天
  private readonly MAX_SIZE = 50 * 1024 * 1024; // 50MB

  // 缓存游戏资源
  async cacheResource(url: string, response: Response): Promise<void> {
    try {
      const blob = await response.blob();

      // 检查大小限制
      if (blob.size > this.MAX_SIZE) {
        console.log(`文件过大，跳过缓存: ${url} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
        return;
      }

      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const cacheData = {
        url,
        data: base64,
        type: blob.type,
        size: blob.size,
        timestamp: Date.now(),
        version: this.CACHE_VERSION
      };

      const key = this.CACHE_PREFIX + this.hashString(url);
      localStorage.setItem(key, JSON.stringify(cacheData));

      // 清理过期缓存
      this.cleanExpiredCache();

      console.log(`缓存成功: ${url} (${(blob.size / 1024).toFixed(2)}KB)`);
    } catch (error) {
      console.error('缓存失败:', error);
    }
  }

  // 获取缓存资源
  async getCachedResource(url: string): Promise<Response | null> {
    try {
      const key = this.CACHE_PREFIX + this.hashString(url);
      const cached = localStorage.getItem(key);

      if (!cached) return null;

      const cacheData = JSON.parse(cached);

      // 检查版本和过期时间
      if (cacheData.version !== this.CACHE_VERSION ||
          Date.now() - cacheData.timestamp > this.MAX_AGE) {
        localStorage.removeItem(key);
        return null;
      }

      // 重新构造Blob
      const binaryString = atob(cacheData.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: cacheData.type });
      return new Response(blob, {
        status: 200,
        statusText: 'OK (Cached)',
        headers: {
          'Content-Type': cacheData.type,
          'Content-Length': cacheData.size.toString(),
          'X-Cache': 'true'
        }
      });
    } catch (error) {
      console.error('读取缓存失败:', error);
      return null;
    }
  }

  // 检查是否有缓存
  hasCache(url: string): boolean {
    const key = this.CACHE_PREFIX + this.hashString(url);
    const cached = localStorage.getItem(key);

    if (!cached) return false;

    try {
      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > this.MAX_AGE;
      const isOldVersion = cacheData.version !== this.CACHE_VERSION;

      if (isExpired || isOldVersion) {
        localStorage.removeItem(key);
        return false;
      }

      return true;
    } catch {
      localStorage.removeItem(key);
      return false;
    }
  }

  // 清理过期缓存
  private cleanExpiredCache(): void {
    const keys = Object.keys(localStorage);
    let cleanedCount = 0;

    for (const key of keys) {
      if (!key.startsWith(this.CACHE_PREFIX)) continue;

      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;

        const cacheData = JSON.parse(cached);
        const isExpired = Date.now() - cacheData.timestamp > this.MAX_AGE;
        const isOldVersion = cacheData.version !== this.CACHE_VERSION;

        if (isExpired || isOldVersion) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`清理了 ${cleanedCount} 个过期缓存项`);
    }
  }

  // 获取缓存统计
  getCacheStats(): { count: number; size: string; items: any[] } {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.CACHE_PREFIX));
    let totalSize = 0;
    const items: any[] = [];

    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) continue;

        const cacheData = JSON.parse(cached);
        totalSize += cacheData.size;

        items.push({
          url: cacheData.url,
          size: cacheData.size,
          age: Date.now() - cacheData.timestamp
        });
      } catch {
        localStorage.removeItem(key);
      }
    }

    return {
      count: items.length,
      size: this.formatFileSize(totalSize),
      items: items.sort((a, b) => b.age - a.age).slice(0, 10)
    };
  }

  // 清除所有缓存
  clearAllCache(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.CACHE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`清除了 ${keys.length} 个缓存项`);
  }

  // 简单哈希函数
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  // 格式化文件大小
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const httpCache = new HttpGameCache();

// 增强的fetch函数，支持本地缓存
export async function cachedFetch(url: string, options?: RequestInit): Promise<Response> {
  // 只缓存同源的GET请求
  if (url.startsWith(window.location.origin) && (!options || options.method === 'GET')) {
    // 检查缓存
    const cachedResponse = await httpCache.getCachedResource(url);
    if (cachedResponse) {
      console.log(`从缓存加载: ${url}`);
      return cachedResponse;
    }

    // 网络请求
    try {
      const response = await fetch(url, options);

      // 只缓存成功的响应
      if (response.ok && response.status === 200) {
        // 克隆响应以便缓存
        const responseToCache = response.clone();
        httpCache.cacheResource(url, responseToCache);
      }

      return response;
    } catch (error) {
      console.error('网络请求失败:', error);
      throw error;
    }
  }

  // 非缓存请求直接fetch
  return fetch(url, options);
}