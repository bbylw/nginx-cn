import { copyFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      // GitHub Pages 没有 SPA 回退规则，直接访问 /docs/overview 之类深链接会 404。
      // 复制一份 index.html 作为 404 页，交给前端路由接管。
      name: "spa-fallback-404",
      apply: "build",
      closeBundle() {
        copyFileSync("dist/index.html", "dist/404.html");
      },
    },
  ],
  // Nimbus 组件包是 webpack UMD 构建，浏览器里没有 Node 的 global。
  // 将 global 映射到 window，避免 `ReferenceError: global is not defined`。
  // 开发期预打包的 global 由 index.html 的 window.global 补丁兜底。
  define: {
    global: "window",
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: "dist",
  },
});
