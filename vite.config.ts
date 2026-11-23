import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
