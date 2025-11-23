import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'fs-extra';
import sirv from 'sirv';
import type { IncomingMessage, ServerResponse } from 'node:http';

const nonameDir = path.resolve(__dirname, 'noname');
const nonameMountPath = '/noname';
const nonameIndexPath = path.join(nonameDir, 'index.html');
const staticInjectionFlag = '__NONAME_STATIC_MODE__';

const aliasEntries = [
  { find: '@', replacement: nonameDir },
  { find: 'vue', replacement: path.resolve(nonameDir, 'game/vue.esm-browser.js') },
  { find: 'typescript', replacement: path.resolve(nonameDir, 'game/typescript.js') },
  { find: '@vue/devtools-api', replacement: path.resolve(nonameDir, 'game/empty-devtools-api.js') },
  { find: '@vue/', replacement: `${path.resolve(nonameDir, 'node_modules/@types/noname-typings/@vue')}/` },
  { find: 'codemirror', replacement: path.resolve(nonameDir, 'game/codemirror6.js') },
  { find: '@codemirror/autocomplete', replacement: path.resolve(nonameDir, 'game/@codemirror/autocomplete/index.js') },
  { find: '@codemirror/commands', replacement: path.resolve(nonameDir, 'game/@codemirror/commands/index.js') },
  { find: '@codemirror/lang-css', replacement: path.resolve(nonameDir, 'game/@codemirror/lang-css/index.js') },
  { find: '@codemirror/lang-html', replacement: path.resolve(nonameDir, 'game/@codemirror/lang-html/index.js') },
  { find: '@codemirror/lang-javascript', replacement: path.resolve(nonameDir, 'game/@codemirror/lang-javascript/index.js') },
  { find: '@codemirror/lang-json', replacement: path.resolve(nonameDir, 'game/@codemirror/lang-json/index.js') },
  { find: '@codemirror/lang-markdown', replacement: path.resolve(nonameDir, 'game/@codemirror/lang-markdown/index.js') },
  { find: '@codemirror/lang-vue', replacement: path.resolve(nonameDir, 'game/@codemirror/lang-vue/index.js') },
  { find: '@codemirror/language', replacement: path.resolve(nonameDir, 'game/@codemirror/language/index.js') },
  { find: '@codemirror/lint', replacement: path.resolve(nonameDir, 'game/@codemirror/lint/index.js') },
  { find: '@codemirror/search', replacement: path.resolve(nonameDir, 'game/@codemirror/search/index.js') },
  { find: '@codemirror/state', replacement: path.resolve(nonameDir, 'game/@codemirror/state/index.js') },
  { find: '@codemirror/view', replacement: path.resolve(nonameDir, 'game/@codemirror/view/index.js') },
  { find: '@lezer/common', replacement: path.resolve(nonameDir, 'node_modules/@lezer/common/dist/index.js') },
  { find: '@lezer/common/', replacement: `${path.resolve(nonameDir, 'node_modules/@lezer/common')}/` },
  { find: '@lezer/css', replacement: path.resolve(nonameDir, 'node_modules/@lezer/css/dist/index.js') },
  { find: '@lezer/css/', replacement: `${path.resolve(nonameDir, 'node_modules/@lezer/css')}/` },
  { find: '@lezer/html', replacement: path.resolve(nonameDir, 'node_modules/@lezer/html/dist/index.js') },
  { find: '@lezer/html/', replacement: `${path.resolve(nonameDir, 'node_modules/@lezer/html')}/` },
  { find: '@lezer/javascript', replacement: path.resolve(nonameDir, 'node_modules/@lezer/javascript/dist/index.js') },
  { find: '@lezer/javascript/', replacement: `${path.resolve(nonameDir, 'node_modules/@lezer/javascript')}/` },
  { find: '@lezer/json', replacement: path.resolve(nonameDir, 'node_modules/@lezer/json/dist/index.js') },
  { find: '@lezer/json/', replacement: `${path.resolve(nonameDir, 'node_modules/@lezer/json')}/` },
  { find: '@lezer/markdown', replacement: path.resolve(nonameDir, 'node_modules/@lezer/markdown/dist/index.js') },
  { find: '@lezer/markdown/', replacement: `${path.resolve(nonameDir, 'node_modules/@lezer/markdown')}/` },
  { find: '@lezer/lr', replacement: path.resolve(nonameDir, 'node_modules/@lezer/lr/dist/index.js') },
  { find: '@lezer/lr/', replacement: `${path.resolve(nonameDir, 'node_modules/@lezer/lr')}/` },
  { find: '@lezer/highlight', replacement: path.resolve(nonameDir, 'node_modules/@lezer/highlight/dist/index.js') },
  { find: '@lezer/highlight/', replacement: `${path.resolve(nonameDir, 'node_modules/@lezer/highlight')}/` },
  { find: 'style-mod', replacement: path.resolve(nonameDir, 'node_modules/style-mod/src/style-mod.js') },
  { find: 'style-mod/', replacement: `${path.resolve(nonameDir, 'node_modules/style-mod')}/` },
  { find: 'crelt', replacement: path.resolve(nonameDir, 'node_modules/crelt/index.js') },
  { find: 'crelt/', replacement: `${path.resolve(nonameDir, 'node_modules/crelt')}/` },
  { find: '@marijn/find-cluster-break', replacement: path.resolve(nonameDir, 'node_modules/@marijn/find-cluster-break/src/index.js') },
  { find: '@marijn/find-cluster-break/', replacement: `${path.resolve(nonameDir, 'node_modules/@marijn/find-cluster-break')}/` },
  { find: 'w3c-keyname', replacement: path.resolve(nonameDir, 'node_modules/w3c-keyname/index.js') },
  { find: 'w3c-keyname/', replacement: `${path.resolve(nonameDir, 'node_modules/w3c-keyname')}/` },
  { find: 'ultron', replacement: path.resolve(nonameDir, 'node_modules/ultron/index.js') },
  { find: 'ultron/', replacement: `${path.resolve(nonameDir, 'node_modules/ultron')}/` },
];

function injectStaticStub(html: string) {
  if (html.includes(staticInjectionFlag)) {
    return html;
  }

  const marker = '<title>无名杀</title>';
  if (!html.includes(marker)) {
    return html;
  }

  const injection = [
    '<script>',
    '  window.__NONAME_STATIC_MODE__ = true;',
    '  if (typeof window.initReadWriteFunction !== "function") {',
    '    window.initReadWriteFunction = async function staticInitReadWrite() {',
    '      return Promise.resolve();',
    '    };',
    '  }',
    '</script>',
  ].join('\n');

  return html.replace(marker, `${marker}\n\t${injection}`);
}

function nonameStaticBridge() {
  return {
    name: 'noname-static-bridge',
    configureServer(server: import('vite').ViteDevServer) {
      // Simple logger middleware to show incoming /api requests in the dev server output.
      // This helps debug whether requests reach the dev server (so proxy can forward them).
      server.middlewares.use((req: IncomingMessage, _res: ServerResponse, next: (err?: unknown) => void) => {
        try {
          const url = req.url || '';
          if (url.startsWith('/api')) {
            // Print remote address if available for easier debugging when accessing via LAN
            const remote = (req.socket as unknown as { remoteAddress?: string })?.remoteAddress || 'unknown';
            console.log(`[vite dev] API request: ${url} from ${remote}`);
          }
        } catch {
          // ignore logging errors
        }
        next();
      });

      const serve = sirv(nonameDir, { dev: true });

      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
        if (!req.url) {
          next();
          return;
        }

        const [rawPath, search = ''] = req.url.split('?');
        const pathname = rawPath || '/';
        const isIndexRequest = pathname === nonameMountPath || pathname === `${nonameMountPath}/` || pathname === `${nonameMountPath}/index.html`;

        if (isIndexRequest) {
          fs.readFile(nonameIndexPath, 'utf8')
            .then((html: string) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(injectStaticStub(html));
            })
            .catch((err: unknown) => next(err));
          return;
        }

        if (pathname.startsWith(nonameMountPath)) {
          const originalUrl = req.url;
          const trimmedPath = pathname.slice(nonameMountPath.length) || '/';
          req.url = search ? `${trimmedPath}?${search}` : trimmedPath;

          serve(req, res, (err?: unknown) => {
            req.url = originalUrl;
            if (err) {
              next(err);
              return;
            }
            next();
          });
          return;
        }

        next();
      });
    },
    async writeBundle() {
      const outDir = path.resolve(__dirname, 'dist', 'noname');
      await fs.remove(outDir);
      await fs.copy(nonameDir, outDir, {
        dereference: true,
        filter: (src: string) => {
          const relative = path.relative(nonameDir, src);
          if (!relative || relative === '') return true;
          const parts = relative.split(path.sep);
          return !parts.some(part => ['.git', '.github', 'node_modules'].includes(part));
        },
      });

      const distIndexPath = path.join(outDir, 'index.html');
      if (await fs.pathExists(distIndexPath)) {
        const html = await fs.readFile(distIndexPath, 'utf8');
        await fs.writeFile(distIndexPath, injectStaticStub(html));
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: aliasEntries,
  },
  plugins: [react(), nonameStaticBridge()],
  // Dev server proxying to backend for API requests
  server: {
    // allow LAN access when developing on a device
    host: true,
    // default dev port (vite will pick a free port if taken)
    port: 5173,
    proxy: {
      // Proxy all /api requests to the backend running on localhost:8000
      // This keeps the frontend using relative paths like /api/.. unchanged.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
