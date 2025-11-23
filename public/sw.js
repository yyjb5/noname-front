const CACHE_NAME = 'noname-react-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/noname/index.html',
  // 动态缓存noname所有资源
];

// 需要缓存的noname资源类型 - 扩大缓存范围
const NONAME_CACHE_PATTERNS = [
  '/noname/',
  '/assets/',
  // 缓存所有游戏相关文件类型
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.mp3',
  '.mp4',
  '.wav',
  '.json'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 只缓存同源请求和重要的跨域资源
  if (url.origin !== location.origin && !isImportantCrossOrigin(url)) {
    return;
  }

  // 检查是否为需要缓存的资源
  const shouldCache = NONAME_CACHE_PATTERNS.some(pattern => {
    if (pattern.startsWith('/')) {
      return url.pathname.includes(pattern);
    } else {
      return url.pathname.endsWith(pattern) || url.pathname.includes(pattern);
    }
  });

  // 对于游戏资源使用缓存优先策略
  if (shouldCache || url.pathname.includes('/noname/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          // 缓存命中，直接返回
          if (response) {
            return response;
          }

          // 网络请求
          return fetch(request)
            .then((response) => {
              // 检查响应有效性
              if (!response || response.status === 0 ||
                  (response.status >= 400 && response.status < 600)) {
                return response;
              }

              // 克隆响应
              const responseToCache = response.clone();

              // 异步缓存（不阻塞返回）
              caches.open(CACHE_NAME)
                .then((cache) => {
                  // 检查响应大小，避免缓存过大的文件
                  responseToCache.clone().blob().then(blob => {
                    // 限制单个文件最大10MB
                    if (blob.size <= 10 * 1024 * 1024) {
                      cache.put(request, responseToCache);
                    }
                  });
                })
                .catch(err => console.log('Cache put error:', err));

              return response;
            })
            .catch(() => {
              // 网络失败，尝试从缓存获取
              return caches.match(request);
            });
        })
    );
  } else {
    // 其他资源使用网络优先
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request);
        })
    );
  }
});

// 检查是否为重要的跨域资源（如CDN等）
function isImportantCrossOrigin(url) {
  const importantDomains = [
    'cdn.jsdelivr.net',
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  return importantDomains.includes(url.hostname);
}

// 后台同步（可选）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 在这里可以执行后台同步任务
      console.log('Background sync triggered')
    );
  }
});

// 推送通知（可选）
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    };

    event.waitUntil(
      self.registration.showNotification('无名杀', options)
    );
  }
});