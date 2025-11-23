# HTTP部署缓存策略

## 🎯 问题分析

你提到的情况很常见：
- **IP部署** - 没有域名证书，无法使用HTTPS
- **Service Worker限制** - 需要HTTPS环境（localhost除外）
- **vite编译部署** - 静态文件部署

## ✅ 解决方案

### 1. 浏览器HTTP缓存策略

vite编译后的静态文件可以利用浏览器缓存：

```javascript
// vite.config.js
export default {
  build: {
    // 为文件名添加hash，利用浏览器缓存
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  server: {
    headers: {
      // 设置缓存头
      'Cache-Control': 'public, max-age=31536000'
    }
  }
}
```

### 2. Nginx/Apache缓存配置

#### Nginx配置：
```nginx
# 静态资源长期缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, no-transform";
    add_header Vary Accept-Encoding;
}

# HTML文件不缓存，确保更新
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

#### Apache配置：
```apache
# 静态资源缓存
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header append Cache-Control "public"
</FilesMatch>

# HTML不缓存
<FilesMatch "\.html$">
    ExpiresActive Off
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>
```

### 3. 游戏资源预加载

在HTML中添加预加载：

```html
<head>
    <!-- 预加载关键游戏资源 -->
    <link rel="preload" href="/noname/index.html" as="document">
    <link rel="preload" href="/noname/game.js" as="script">
</head>
```

### 4. 应用层缓存

创建简单的内存缓存：

```javascript
// src/utils/cache.ts
class GameCache {
  private cache = new Map<string, any>();
  private maxSize = 100; // 最大缓存项数

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;

    // 1小时过期
    if (Date.now() - item.timestamp > 3600000) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }
}

export const gameCache = new GameCache();
```

## 🚀 部署优化建议

### 1. 构建优化
```bash
# 构建时启用压缩
npm run build -- --mode production

# 额外压缩静态文件
npm run compress  # 需要配置compress插件
```

### 2. CDN部署（如果有）
即使没有HTTPS，也可以使用HTTP CDN：
- 七牛云、又拍云等支持HTTP CDN
- 将静态资源上传到CDN
- 游戏文件本地部署

### 3. 本地存储缓存
```javascript
// 利用localStorage缓存游戏数据
class LocalGameCache {
  private prefix = 'noname_cache_';

  async cacheResource(url: string, data: any): Promise<void> {
    const key = this.prefix + btoa(url);
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      url
    }));
  }

  async getCachedResource(url: string): Promise<any> {
    const key = this.prefix + btoa(url);
    const cached = localStorage.getItem(key);

    if (!cached) return null;

    const parsed = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    // 缓存7天
    if (age > 7 * 24 * 3600000) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  }
}
```

## 💡 实施步骤

1. **配置vite构建** - 添加文件名hash
2. **设置Web服务器缓存** - Nginx/Apache配置
3. **实现应用层缓存** - localStorage内存缓存
4. **预加载关键资源** - 减少首屏加载时间
5. **压缩优化** - 减少文件大小

## 📊 效果预期

- **首次加载**: 取决于网络和文件大小
- **再次访问**: 90%以上资源从缓存加载
- **游戏内资源**: 可通过localStorage缓存实现离线效果
- **更新机制**: 通过HTML文件更新自动刷新

这样即使没有Service Worker，也能实现很好的缓存效果！