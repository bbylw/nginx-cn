# NGINX 中文站 · 落地页 + 完整文档

对标 [nginx.org/en/docs/index.html](https://nginx.org/en/docs/index.html) 的**完整中文文档**，外加一个以能力展示为主的落地页（内容依据 [官方 README](https://github.com/nginx/nginx/blob/master/README.md) 与官方文档页面）。

> 技术栈：**Nimbus + Bun**（均为最新发行版）

- **Bun 1.4.5** — 运行时 / 包管理 / 生产静态服务器
- **@nimbus-ds/styles 9.74.0** · **@nimbus-ds/components 5.68.0** · **@nimbus-ds/tokens 9.8.0**
- **React 19.3.1** · **Vite 8.3.8** · **react-router-dom 7.18.6**

## 内容规模

| 项目 | 数量 |
|---|---|
| 中文手册章节 | **30 章**（覆盖官方 Introduction / How-To / Development 全部分节） |
| 官方模块 | **103 个**（核心 4 · HTTP 67 · Stream 24 · Mail 8） |
| 可搜索指令 | **1104 条**（取自各模块页面的真实目录） |
| 手写示例配置 | **56 个常用模块**，其余链接到官方 Example Configuration |

## 运行

```bash
bun install --registry https://registry.npmjs.org
bun run dev        # 开发：http://localhost:5173
bun run build      # 构建到 dist/
bun run start      # 生产：Bun 静态服务器 http://localhost:4173
```

端口预览（推荐）：`portless nginx-cn vite` → `https://nginx-cn.localhost`

## 页面结构

| 路由 | 说明 |
|---|---|
| `/` | 落地页（纯能力展示，不含站内文档入口）：Hero → 7 项能力 tab（真实 nginx.conf）→ 替代清单 → 请求管道 → 架构对比 → 6 个场景 → 平滑重载 → 事实条 → 收尾 |
| `/docs/overview` … | 30 章手册，见下表 |
| `/docs/modules` | 模块总览：按组筛选 + 按模块名/中文名/**指令名**搜索 |
| `/docs/modules/:slug` | 模块详情：中文说明、版本、是否需显式编译、指令清单（跳官方锚点）、最小示例 |

### 手册章节

**开始使用** — 什么是 NGINX · 安装 nginx · 从源码构建（configure 参数）· 新手指南 · 工作原理

**运行与控制** — 控制 nginx（信号与热升级）· 命令行参数 · 配置单位 · 设置哈希表 · 连接处理方法 · 正则捕获 · 调试日志 · 记录到 syslog · QUIC 与 HTTP/3 · nginx for Windows

**HTTP 主题** — 请求处理流程 · server_name 规则 · HTTP 负载均衡 · 配置 HTTPS · WebSocket 代理 · 从 Apache 规则迁移

**四层与脚本** — TCP/UDP 会话处理 · 用 njs 编写脚本 · 入门实践（四个高频配方）

**开发与社区** — 贡献代码 · 开发指南 · Win32 构建 · DTrace 调试 · 常见问题 · 支持与资源

## 结构

```
public/
  nginx-mark.svg             # 官方 N 标记（取自 nginx.org/img/nginx_logo.svg）
  favicon.svg                # 官方标记作为 SVG 图标
  favicon.ico                # 官方 favicon.ico（16/32/48）
src/
  main.tsx
  App.tsx                    # 路由
  index.css                  # Nimbus 样式 + 中文站设计基线（响应式）
  data/handbook.ts           # 30 章中文手册（依据官方各页面正文）
  data/modules.ts            # 103 个模块：中文名、说明、版本、指令清单（生成）
  data/module-examples.ts    # 常用模块的最小示例配置
  components/                # Navbar / Footer / CodeBlock
  pages/Home.tsx             # 落地页
  pages/Docs.tsx             # 手册布局 + 搜索 + 上一章/下一章
  pages/Modules.tsx          # 模块总览 + 模块详情
dist-server.js               # Bun 静态服务器（SPA 回退）
```

`data/modules.ts` 由官方文档索引抓取生成：模块清单来自 `index.html`，指令清单来自各模块页面的目录锚点，`since` 版本号取自模块摘要。

## 内容来源

- 文档目录：https://nginx.org/en/docs/index.html
- 落地页与运行时描述：https://github.com/nginx/nginx/blob/master/README.md
- 徽标与图标：nginx.org 官方资源（`/img/nginx_logo.svg` 的 N 标记、`/favicon.ico`）
- 各章节正文：nginx.org 对应页面（install / configure / control / events / hash / debugging_log / syslog / syntax / regex_captures / switches / windows / quic / http/* / stream/* / njs / faq …）

中文内容为整理与意译，**以官方英文文档为准**。

## 许可证

本站代码以 MIT 展示；NGINX 本体采用 2 条款 BSD 式许可证，详见官方仓库 LICENSE。

## 部署

- 仓库：<https://github.com/bbylw/nginx-cn>
- 线上地址：<https://nginx.ndjp.net>
- 托管：GitHub Pages（Actions 构建 → 上传 `dist` 产物），配置文件 `.github/workflows/deploy.yml`
- 推送 `main` 即触发部署；`public/CNAME` 固定自定义域名，构建时复制为 `dist/CNAME`
- 构建额外产出 `dist/404.html`（`index.html` 的副本），让 `/docs/overview` 这类深链接由前端路由接管
- DNS：`nginx.ndjp.net` 已指向 GitHub Pages 的四条 A 记录（185.199.108/109/110/111.153）
