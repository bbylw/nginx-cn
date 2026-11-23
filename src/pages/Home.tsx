import { useRef, useState } from "react";
import { MODULES, DIRECTIVE_INDEX } from "../data/modules";

/* ============================================================
   数据
   ============================================================ */
type Cap = {
  key: string;
  label: string;
  title: string;
  desc: string;
  points: string[];
  code: string;
  chips: string[];
};

const CAPS: Cap[] = [
  {
    key: "proxy",
    label: "反向代理",
    title: "后端只写业务，入口的事交给 nginx",
    desc:
      "请求先落到 nginx，再由 location 决定去向。上游连接用 keepalive 池复用，超时、重试、头部改写都在这一层落定，后端进程不必关心真实客户端 IP、也不必自己扛 TLS。",
    points: [
      "location 匹配决定路由，proxy_pass 决定去向",
      "proxy_set_header 透传真实 IP 与 Host",
      "proxy_next_upstream 定义哪些失败值得换一台重试",
    ],
    code: `upstream app {
    zone      app_pool 64k;
    server    10.0.0.11:8080 weight=3;
    server    10.0.0.12:8080 backup;
    keepalive 64;
}

server {
    listen 443 ssl;
    http2  on;

    location /api/ {
        proxy_pass            http://app;
        proxy_http_version    1.1;
        proxy_set_header      Connection "";
        proxy_set_header      Host       $host;
        proxy_set_header      X-Real-IP  $remote_addr;
        proxy_connect_timeout 3s;
        proxy_next_upstream   error timeout http_502;
    }
}`,
    chips: ["proxy_pass", "proxy_set_header", "proxy_next_upstream", "keepalive", "zone"],
  },
  {
    key: "balance",
    label: "负载均衡",
    title: "把请求摊开，也把坏节点摘掉",
    desc:
      "默认轮询，权重可调；要会话粘性用 ip_hash，要缓存亲和用一致性哈希。least_conn 把请求送给当前最闲的一台，max_fails 与 fail_timeout 负责被动健康检查，slow_start 让刚上线的节点慢慢接流量。",
    points: [
      "weight / backup / down 控制每台机器的参与方式",
      "least_conn、ip_hash、hash ... consistent 三种分配策略",
      "max_fails + fail_timeout 自动摘除并回探故障节点",
    ],
    code: `upstream app {
    least_conn;
    server 10.0.0.11:8080 weight=3 max_fails=2 fail_timeout=10s;
    server 10.0.0.12:8080 slow_start=30s;
    server 10.0.0.13:8080 backup;
}

# 一致性哈希：同一个 URL 永远落到同一台缓存节点
upstream cache_tier {
    hash    $request_uri consistent;
    server  10.0.1.11:8080;
    server  10.0.1.12:8080;
}`,
    chips: ["upstream", "least_conn", "ip_hash", "hash", "server"],
  },
  {
    key: "cache",
    label: "内容缓存",
    title: "命中就不回源，回源也只回一次",
    desc:
      "proxy_cache 把上游响应存进磁盘共享区，命中时直接回写。上游抖动时用 stale 先顶上，并发回源用 cache_lock 合并成一次，后台更新则让用户永远拿到旧值而不是等待。",
    points: [
      "keys_zone 定义共享内存索引，磁盘只存正文",
      "proxy_cache_use_stale 在上游故障时继续服务",
      "proxy_cache_lock 防止缓存击穿把后端打穿",
    ],
    code: `proxy_cache_path /var/cache/nginx levels=1:2
                 keys_zone=zone_a:100m
                 max_size=10g inactive=60m
                 use_temp_path=off;

server {
    location / {
        proxy_cache                zone_a;
        proxy_cache_key            "$scheme$request_method$host$request_uri";
        proxy_cache_valid          200 302 10m;
        proxy_cache_valid          404 1m;
        proxy_cache_use_stale      error timeout updating http_500 http_502;
        proxy_cache_lock           on;
        proxy_cache_background_update on;
        add_header X-Cache-Status  $upstream_cache_status;
        proxy_pass                 http://app;
    }
}`,
    chips: ["proxy_cache_path", "proxy_cache", "proxy_cache_valid", "proxy_cache_use_stale", "proxy_cache_lock"],
  },
  {
    key: "limit",
    label: "限流保护",
    title: "先保住服务，再谈体验",
    desc:
      "漏桶算法按 key 限速：burst 允许短时突发，nodelay 让队列立刻放行而不排队。请求速率与并发连接是两码事，limit_conn 单独算一档。配上 429 状态码，客户端才知道该退避。",
    points: [
      "limit_req_zone 的 key 可以是 IP、用户 ID 或任意变量",
      "burst + nodelay 平滑突发，避免误伤正常用户",
      "limit_req_dry_run 先观测再上线，不动线上流量",
    ],
    code: `http {
    limit_req_zone  $binary_remote_addr zone=per_ip:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_per_ip:10m;

    server {
        location /api/ {
            limit_req    zone=per_ip burst=20 nodelay;
            limit_req_status 429;

            limit_conn        conn_per_ip 20;
            limit_conn_status 429;

            proxy_pass   http://app;
        }
    }
}`,
    chips: ["limit_req_zone", "limit_req", "limit_req_dry_run", "limit_conn_zone", "limit_conn"],
  },
  {
    key: "tls",
    label: "TLS / HTTP/3",
    title: "握手的钱，省在会话复用上",
    desc:
      "TLS 1.3、共享会话缓存、OCSP stapling 把每次握手的往返压到最低。同一个 443 端口再开 QUIC：支持 HTTP/3 的客户端走 UDP，其余自动降级到 HTTP/2，配置只多两行。",
    points: [
      "ssl_session_cache shared 让所有 worker 共用会话票据",
      "ssl_stapling 由 nginx 代取 OCSP，客户端不必外连",
      "listen 443 quic reuseport 与 http2 on 并存",
    ],
    code: `server {
    listen              443 ssl;
    listen              443 quic reuseport;
    http2               on;

    ssl_certificate     /etc/nginx/ssl/example.com.pem;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;

    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling        on;
    ssl_stapling_verify on;

    add_header Alt-Svc 'h3=":443"; ma=86400' always;
    add_header Strict-Transport-Security "max-age=31536000" always;
}`,
    chips: ["ssl_certificate", "ssl_session_cache", "ssl_stapling", "http2", "http3"],
  },
  {
    key: "stream",
    label: "四层代理",
    title: "TCP / UDP 也能被编排",
    desc:
      "stream 块不解析 HTTP，只做四层转发。配合 ssl_preread 读出 ClientHello 里的 SNI，一台 nginx 就能按域名把加密流量分给不同后端——全程不解密，证书留在后端。",
    points: [
      "stream 支持 TCP 与 UDP，负载均衡策略与 HTTP 一致",
      "ssl_preread 在不解密的前提下读出 SNI 与 ALPN",
      "proxy_protocol 把真实源地址透传给后端",
    ],
    code: `stream {
    map $ssl_preread_server_name $backend {
        a.example.com  app_a;
        b.example.com  app_b;
        default        app_default;
    }

    upstream app_a       { server 10.0.2.11:443; }
    upstream app_b       { server 10.0.2.12:443; }
    upstream app_default { server 10.0.2.13:443; }

    server {
        listen       443;
        proxy_pass   $backend;
        ssl_preread  on;
    }
}`,
    chips: ["stream", "ssl_preread", "proxy_pass", "map", "upstream"],
  },
  {
    key: "observe",
    label: "可观测",
    title: "每个请求都留下可查的痕迹",
    desc:
      "一条访问日志可以带上总耗时、上游耗时、缓存状态与实际命中的上游地址；stub_status 暴露实时连接数给监控抓取；需要链路追踪时，otel 模块直接把 span 推给 OpenTelemetry 后端。",
    points: [
      "log_format 自定义字段，$request_time 定位慢请求",
      "$upstream_cache_status 区分 HIT / MISS / STALE",
      "stub_status 只暴露计数，记得用 allow / deny 收紧",
    ],
    code: `log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" rt=$request_time '
                'urt=$upstream_response_time '
                'cache=$upstream_cache_status up=$upstream_addr';

server {
    access_log /var/log/nginx/access.log main;

    location = /basic_status {
        stub_status;
        allow 10.0.0.0/8;
        deny  all;
    }
}`,
    chips: ["log_format", "access_log", "stub_status", "otel_exporter", "otel_trace"],
  },
];

/* 一条请求的一生 */
const PIPELINE = [
  { cmd: "accept", title: "收下连接", note: "事件循环从 epoll / kqueue 取出就绪的 socket" },
  { cmd: "ssl_handshake", title: "TLS 握手", note: "优先复用会话票据，1-RTT 甚至 0-RTT 完成" },
  { cmd: "server_name", title: "选定虚拟主机", note: "按 SNI 与 Host 匹配 server 块" },
  { cmd: "location", title: "匹配路由", note: "前缀、正则、精确匹配决定这段请求怎么走" },
  { cmd: "limit_req", title: "过闸", note: "限速、并发数、鉴权都发生在回源之前" },
  { cmd: "proxy_cache", title: "查缓存", note: "命中直接回写，未命中才轮到上游" },
  { cmd: "upstream", title: "转发上游", note: "从连接池取一条 keepalive 连接，等首字节" },
  { cmd: "sendfile", title: "回写响应", note: "零拷贝发送，gzip 只压缩该压缩的类型" },
];

/* 一套顶一套 */
const REPLACE: [string, string][] = [
  ["硬件 / 软件负载均衡器", "upstream app { least_conn; }"],
  ["独立的反向代理进程", "proxy_pass http://app;"],
  ["API 网关（限流 + 鉴权）", "limit_req …  auth_request /auth"],
  ["静态缓存层（Varnish 之类）", "proxy_cache zone_a;"],
  ["TLS 终结器", "listen 443 ssl;  listen 443 quic;"],
  ["四层负载均衡 / 端口转发", "stream { proxy_pass …; }"],
  ["静态文件服务器", "root /var/www;  sendfile on;"],
  ["灰度 / A-B 分流组件", "split_clients $cookie_uid $ver { … }"],
];

/* 真实场景 */
const SCENARIOS = [
  {
    tag: "静态与边缘",
    title: "前端产物与图片站",
    desc: "构建产物直接托管，gzip_static 吐预压缩文件；代理层再缓存一层，回源只发生在新版本发布那一刻。",
    cmd: "gzip_static on",
  },
  {
    tag: "API 网关",
    title: "鉴权、限流、路由收在一处",
    desc: "auth_request 调用鉴权子请求，通过才放行；限流与改写写在同一个 location 里，微服务只关心自己的接口。",
    cmd: "auth_request /auth",
  },
  {
    tag: "微服务入口",
    title: "上游池与故障摘除",
    desc: "连接池复用长连接，proxy_next_upstream 在 502 / 超时后自动换节点，节点恢复后靠回探重新入池。",
    cmd: "proxy_next_upstream",
  },
  {
    tag: "灰度发布",
    title: "按比例切流做 A/B",
    desc: "split_clients 按百分比把流量切成两组，key 用 cookie 或 IP，同一个用户稳定命中同一版本。",
    cmd: "split_clients",
  },
  {
    tag: "长连接",
    title: "WebSocket 与 SSE",
    desc: "透传 Upgrade 头，放宽读超时，长连接就能穿过代理；心跳间隔由后端决定，nginx 只负责不掐断。",
    cmd: "proxy_read_timeout",
  },
  {
    tag: "四层",
    title: "数据库与 TCP 服务",
    desc: "MySQL、Redis、gRPC 走 stream 转发，按 SNI 或端口分流，顺便做一层来源白名单。",
    cmd: "proxy_protocol on",
  },
];

/* 平滑重载 */
const RELOAD_STEPS = [
  { t: "改配置", d: "只动需要动的 server / location，其余原样保留。" },
  { t: "nginx -t", d: "语法、证书路径、端口占用先校验；失败就停在这里，线上不受影响。" },
  { t: "nginx -s reload", d: "master 启动新 worker，老 worker 处理完在途请求才退出——连接不断。" },
  { t: "热升级二进制", d: "USR2 起新 master，WINCH 让老 worker 交班，QUIT 收掉老 master。" },
];

const INSTALL_CMD = "sudo apt install nginx\nsudo systemctl enable --now nginx\ncurl -I localhost";

/* 小节标题 */
function SecHead({
  idx,
  kicker,
  title,
  desc,
  dark,
}: {
  idx: string;
  kicker: string;
  title: string;
  desc: string;
  dark?: boolean;
}) {
  return (
    <header className={`lp-sec-head ${dark ? "lp-on-dark" : ""}`}>
      <span className="lp-kicker">
        <b className="lp-kicker-n">{idx}</b>
        {kicker}
      </span>
      <h2>{title}</h2>
      <p>{desc}</p>
    </header>
  );
}

export default function Home() {
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function onTabKey(e: React.KeyboardEvent) {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (tab + dir + CAPS.length) % CAPS.length;
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  const cap = CAPS[tab];

  return (
    <div className="lp">
      {/* ================= 01 HERO ================= */}
      <section className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-hero-grid">
            <div>
              <span className="lp-eyebrow">
                <i />事件驱动 · 异步非阻塞 · HTTP/3
              </span>
              <h1 className="lp-h1">
                一个进程，
                <br />
                <em>扛住整站流量</em>
              </h1>
              <p className="lp-lead">
                反向代理、负载均衡、内容缓存、请求限流、TLS 卸载、四层转发——NGINX 把边缘需要的全部能力装进一个二进制。
                改一份 <code>nginx.conf</code>，就能重新编排整条链路。
              </p>
              <div className="lp-cta-row">
                <a href="#capabilities" className="lp-btn-main">
                  看它能做什么 ↓
                </a>
                <a
                  href="https://nginx.org/en/download.html"
                  target="_blank"
                  rel="noreferrer"
                  className="lp-btn-ghost"
                >
                  下载 nginx ↗
                </a>
              </div>
              <div className="lp-hero-note">
                Linux · FreeBSD · Windows · 2-Clause BSD · 模块可动态加载
              </div>
            </div>

            {/* 流量面板 */}
            <div className="lp-board" role="img" aria-label="请求流经 nginx 的示意">
              <div className="lp-board-head">
                <span className="lp-live">
                  <i />
                  示意
                </span>
                <span className="lp-board-mono">worker #1 · epoll · 单线程事件循环</span>
              </div>

              <div className="lp-flow">
                <div className="lp-clients">
                  {[
                    ["浏览器", "/index.html"],
                    ["移动端", "/api/orders"],
                    ["边缘节点", "/img/cover.jpg"],
                  ].map(([n, p], i) => (
                    <div className="lp-client" key={n} style={{ animationDelay: `${i * 0.5}s` }}>
                      <b>{n}</b>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>

                <div className="lp-core">
                  <div className="lp-core-tag">nginx</div>
                  {PIPELINE.slice(0, 7).map((s, i) => (
                    <div className="lp-stage" key={s.cmd}>
                      <span className="lp-stage-name">{s.cmd}</span>
                      <span className="lp-bar">
                        <i style={{ animationDelay: `${i * 0.42}s` }} />
                      </span>
                    </div>
                  ))}
                  <div className="lp-core-hit">cache HIT · 直接回写</div>
                </div>

                <div className="lp-ups">
                  {[
                    ["app-01", "10.0.0.11"],
                    ["app-02", "10.0.0.12"],
                    ["cache-01", "10.0.1.11"],
                  ].map(([n, ip], i) => (
                    <div className="lp-up" key={n} style={{ animationDelay: `${i * 0.4}s` }}>
                      <b>{n}</b>
                      <span>{ip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lp-board-foot">
                <span>TLS 1.3 会话复用</span>
                <span>上游 keepalive 池</span>
                <span>gzip / sendfile</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lp-hero-strip">
          <div className="lp-wrap lp-strip-inner">
            {[
              ["事件驱动", "epoll / kqueue"],
              ["七层代理", "HTTP/1.1 · 2 · 3"],
              ["四层代理", "TCP · UDP"],
              ["动态模块", "load_module"],
              ["脚本扩展", "njs · JavaScript"],
              ["邮件代理", "IMAP · POP3 · SMTP"],
            ].map(([a, b]) => (
              <div className="lp-strip-item" key={a}>
                <b>{a}</b>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 02 能力 ================= */}
      <section className="lp-section" id="capabilities">
        <div className="lp-wrap">
          <SecHead
            idx="01"
            kicker="能力"
            title="七种角色，一份配置"
            desc="下面每一段都是能直接抄进 nginx.conf 的真实写法，不是伪代码。点开看它怎么把这件事做掉。"
          />

          <div className="lp-tabs" role="tablist" aria-label="能力分类" onKeyDown={onTabKey}>
            {CAPS.map((c, i) => (
              <button
                key={c.key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`cap-tab-${c.key}`}
                role="tab"
                aria-selected={i === tab}
                aria-controls="cap-panel"
                tabIndex={i === tab ? 0 : -1}
                className={`lp-tab ${i === tab ? "on" : ""}`}
                onClick={() => setTab(i)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div
            className="lp-panel"
            role="tabpanel"
            id="cap-panel"
            aria-labelledby={`cap-tab-${cap.key}`}
          >
            <div className="lp-panel-text" key={cap.key}>
              <h3>{cap.title}</h3>
              <p>{cap.desc}</p>
              <ul className="lp-points">
                {cap.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="lp-chips" aria-label="相关指令">
                {cap.chips.map((d) => (
                  <span key={d} className="lp-chip">
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div className="lp-panel-code">
              <div className="lp-code-head">
                <span>nginx.conf</span>
                <span className="lp-code-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <pre key={cap.key}>{cap.code}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 03 一套顶一套 ================= */}
      <section className="lp-section lp-soft" id="coverage">
        <div className="lp-wrap">
          <SecHead
            idx="02"
            kicker="覆盖面"
            title="它替掉的，是一整排中间件"
            desc="同一份二进制把这些角色全收了：少一次网络跳转、少一个进程、少一套配置——故障点也就跟着少。"
          />
          <div className="lp-replace">
            <div className="lp-replace-row lp-replace-head">
              <span>没有 nginx 时得摆这些</span>
              <span>现在写进 nginx.conf</span>
            </div>
            {REPLACE.map(([what, cmd]) => (
              <div className="lp-replace-row" key={what}>
                <span className="lp-replace-what">{what}</span>
                <span className="lp-replace-arrow" aria-hidden>
                  →
                </span>
                <code className="lp-replace-cmd">{cmd}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 04 请求管道 ================= */}
      <section className="lp-dark" id="pipeline">
        <div className="lp-wrap">
          <SecHead
            dark
            idx="03"
            kicker="一条请求的一生"
            title="从 socket 到第一个字节"
            desc="每一环都能跳过，每一环都能配置。理解这条链，就理解了大半线上问题的位置。"
          />
          <div className="lp-pipe">
            {PIPELINE.map((s, i) => (
              <div className="lp-pipe-step" key={s.cmd}>
                <span className="lp-pipe-n">{String(i + 1).padStart(2, "0")}</span>
                <b>{s.title}</b>
                <span className="lp-pipe-cmd">{s.cmd}</span>
                <p>{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 05 为什么快 ================= */}
      <section className="lp-section" id="architecture">
        <div className="lp-wrap">
          <SecHead
            idx="04"
            kicker="架构"
            title="它不是“更快的 Apache”，是另一种模型"
            desc="性能差异不来自更聪明的代码，而来自不为什么都不做而付出代价。"
          />

          <div className="lp-vs">
            <div className="lp-vs-card bad">
              <div className="lp-vs-head">
                <span className="lp-vs-mark">✕</span>
                <b>每连接占用一份执行资源</b>
              </div>
              <ul>
                <li>一个连接一个进程 / 线程，栈内存随连接数线性增长</li>
                <li>上下文切换吃 CPU，慢客户端会把执行单元占死</li>
                <li>要撑住更多连接，只能加机器或加内存</li>
              </ul>
              <div className="lp-vs-foot">连接数上限 ≈ 可用内存 ÷ 单连接开销</div>
            </div>

            <div className="lp-vs-card good">
              <div className="lp-vs-head">
                <span className="lp-vs-mark">✓</span>
                <b>一个 worker，管住上万个 socket</b>
              </div>
              <ul>
                <li>单线程事件循环，用 epoll / kqueue 等待就绪事件</li>
                <li>连接状态存在状态机里，不占线程，慢客户端不影响别人</li>
                <li>限流、缓存、连接计数放在共享内存 zone，跨 worker 一致</li>
              </ul>
              <div className="lp-vs-foot">连接数上限 ≈ worker_processes × worker_connections</div>
            </div>
          </div>

          <div className="lp-tune">
            <div>
              <h3>把这两个数字调对，压测结果就变了</h3>
              <p>
                默认值偏保守：<code>worker_connections</code> 是 512，进程数要手动指定。生产环境按 CPU 核数与 fd
                上限重算一遍，再打开 sendfile 与 tcp_nopush，静态文件的路径就短了一截。
              </p>
              <ul className="lp-points">
                <li>
                  <code>worker_processes auto</code> 跟随核数，避免多进程抢同一个核
                </li>
                <li>
                  <code>worker_rlimit_nofile</code> 要大于进程实际需要的 fd 数
                </li>
                <li>
                  <code>keepalive_timeout</code> 决定空闲连接能复用多久
                </li>
              </ul>
            </div>
            <div className="lp-panel-code">
              <div className="lp-code-head">
                <span>nginx.conf · 运行时调优</span>
                <span className="lp-code-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <pre>{`worker_processes      auto;
worker_rlimit_nofile  65535;

events {
    worker_connections 10240;
    multi_accept       on;
    use                epoll;
}

http {
    sendfile           on;
    tcp_nopush         on;
    keepalive_timeout  65;
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 06 场景 ================= */}
      <section className="lp-section lp-soft" id="scenarios">
        <div className="lp-wrap">
          <SecHead
            idx="05"
            kicker="场景"
            title="它真正被用来做什么"
            desc="同一个二进制，在这些位置上换成完全不同的配置——这大概就是它流行二十年的原因。"
          />
          <div className="lp-scn-grid">
            {SCENARIOS.map((s, i) => (
              <div className="lp-scn" key={s.title}>
                <div className="lp-scn-top">
                  <span className="lp-scn-tag">{s.tag}</span>
                  <span className="lp-scn-n">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <div className="lp-scn-foot">
                  <code>{s.cmd}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 07 平滑重载 ================= */}
      <section className="lp-section" id="reload">
        <div className="lp-wrap lp-reload">
          <div>
            <SecHead
              idx="06"
              kicker="运维"
              title="改配置，不用断连接"
              desc="这是 NGINX 最容易被低估的能力：reload 不是重启。master 只做一件事——让新 worker 接班，等老 worker 把手上的请求处理完再退场。"
            />
            <ol className="lp-steps">
              {RELOAD_STEPS.map((s, i) => (
                <li key={s.t}>
                  <span className="lp-step-n">{i + 1}</span>
                  <div>
                    <b>{s.t}</b>
                    <span>{s.d}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="lp-panel-code">
            <div className="lp-code-head">
              <span>shell</span>
              <span className="lp-code-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
            <pre>{`nginx -t                 # 先校验，语法/证书错误止步于此
nginx -s reload          # 平滑重载：新 worker 接班，老 worker 排空退出
nginx -s reopen          # 重开日志文件，配合 logrotate
nginx -V                 # 看编译参数与已装模块

# 二进制热升级（不重启进程）
kill -USR2 $(cat /run/nginx.pid)          # 新 master 启动
kill -WINCH $(cat /run/nginx.pid.oldbin)  # 老 worker 交班
kill -QUIT $(cat /run/nginx.pid.oldbin)   # 老 master 退出`}</pre>
          </div>
        </div>
      </section>

      {/* ================= 08 事实 ================= */}
      <section className="lp-facts">
        <div className="lp-wrap lp-facts-inner">
          {[
            ["2004", "首次开源发布"],
            ["2-Clause", "BSD 式许可证"],
            [`${MODULES.length}`, "官方模块"],
            [`${DIRECTIVE_INDEX.length}`, "条指令"],
            ["3", "HTTP/1.1 · 2 · 3"],
            ["njs", "JavaScript 扩展"],
          ].map(([n, l]) => (
            <div className="lp-fact" key={l}>
              <b>{n}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 09 收尾 ================= */}
      <section className="lp-end">
        <div className="lp-wrap lp-end-inner">
          <div>
            <span className="lp-kicker lp-on-dark">下一步</span>
            <h2>起一个 worker，接住下一波流量</h2>
            <p>安装是一次性的，配置是可以随时重排的——这就是它上线二十年还在主流的答案。</p>
          </div>
          <div className="lp-end-card">
            <pre>{INSTALL_CMD}</pre>
            <div className="lp-end-actions">
              <button type="button" className="lp-mini-btn" onClick={copyInstall}>
                {copied ? "已复制 ✓" : "复制命令"}
              </button>
              <span className="lp-end-hint">Debian / Ubuntu · 其余发行版命令略有差异</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
