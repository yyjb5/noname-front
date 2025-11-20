# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

````js
export default defineConfig([
  # React 无名杀壳项目

  > React + TypeScript + Vite shell that statically serves the `noname` repository as a Git submodule.

  ## 项目结构

  - `noname/`：作为 Git submodule 引入的上游仓库 [`libnoname/noname`](https://github.com/libnoname/noname)。构建时会完整复制到输出目录的 `/noname` 路径。
  - `src/`：React 外壳代码，提供 UI 包裹、iframe 预览及快捷入口。
  - `vite.config.ts`：挂载 `noname` 子模块的静态资源，在开发服务器与构建产物中都可通过 `/noname/**` 访问。

  ## 开发

  ```bash
  pnpm install
  pnpm dev
````

开发服务器启动后，首页会以内嵌 iframe 方式加载 `/noname/index.html`。也可通过页面按钮在新标签页中打开原生页面。

## 构建

```bash
pnpm build
```

构建完成后，`dist/` 目录将包含：

- React 外壳页面（默认入口 `index.html`）。
- 来自子模块的静态资源（位于 `dist/noname`，保留原始结构）。

部署时只需将 `dist/` 目录托管到支持 HTTPS 的静态站点或 CDN，访问 `/noname/index.html` 即可获得原版游戏体验。

## 常见操作

- 更新子模块：`git submodule update --remote --merge`。
- 清理复制后的产物：直接删除 `dist/` 目录。
- Lint 检查（忽略子模块）：`pnpm lint`。

如需进一步对 `noname` 进行模块化改造，可在保证子模块独立性的前提下，在 React 外壳中增添更多路由与联动逻辑。
// Enable lint rules for React
