// Bun 静态服务器：服务 dist 并支持 SPA 回退
import { join } from "node:path";

const PORT = process.env.PORT || 4173;
const DIST = join(import.meta.dir, "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname === "/" ? "/index.html" : url.pathname;
    let file = Bun.file(join(DIST, path));
    if (await file.exists()) {
      const ext = path.slice(path.lastIndexOf("."));
      return new Response(file, { headers: { "content-type": MIME[ext] || "application/octet-stream" } });
    }
    // SPA 回退
    return new Response(Bun.file(join(DIST, "index.html")), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`NGINX-CN 已启动：http://localhost:${PORT}`);
