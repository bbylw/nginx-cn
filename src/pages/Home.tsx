import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MODULES, DIRECTIVE_INDEX } from "../data/modules";
import CopyAction from "../components/CopyAction";
import NginxCode, { renderCodeLine } from "../components/NginxCode";
import { Reveal, TaglineReveal } from "../components/Reveal";
import {
  IconArrowsLeftRight,
  IconCheck,
  IconDatabase,
  IconGauge,
  IconLightning,
  IconLockKey,
  IconPause,
  IconPlay,
  IconPulse,
  IconScales,
  IconShareNetwork,
  IconX,
} from "../components/Icons";

type Cap = {
  key: string;
  label: string;
  title: string;
  desc: string;
  points: string[];
  code: string;
  chips: string[];
  icon: React.ReactNode;
};

const CAPS: Cap[] = [
  {
    key: "proxy",
    label: "反向代理",
    icon: <IconArrowsLeftRight size={16} />,
    title: "后端只写业务，入口的事交给 nginx",
    desc: "请求先落到 nginx，再由 location 决定去向。上游连接用 keepalive 池复用，超时、重试与头部改写都在这一层落定，后端进程不必关心真实客户端 IP，也不必自己扛 TLS。",
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
    icon: <IconScales size={16} />,
    title: "把请求摊开，也把坏节点摘掉",
    desc: "默认轮询且权重可调；需要会话粘性用 ip_hash，需要缓存亲和用一致性哈希。least_conn 把请求送给当前最闲的一台，max_fails 与 fail_timeout 负责被动健康检查，slow_start 让新上线节点平稳接流量。",
    points: [
      "weight、backup 与 down 控制每台机器的参与方式",
      "least_conn、ip_hash 与一致性哈希三种分配策略",
      "max_fails 与 fail_timeout 自动摘除并回探故障节点",
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
    icon: <IconDatabase size={16} />,
    title: "命中就不回源，回源也只回一次",
    desc: "proxy_cache 把上游响应存进磁盘共享区，命中时直接回写。上游抖动时用 stale 先顶上，并发回源用 cache_lock 合并成一次，后台更新则让用户直接拿到缓存副本而不是干等。",
    points: [
      "keys_zone 定义共享内存索引，磁盘只存响应正文",
      "proxy_cache_use_stale 在上游故障时继续提供兜底响应",
      "proxy_cache_lock 防止热点缓存击穿打垮后端",
    ],
    code: `proxy_cache_path /var/cache/nginx levels=1:2
                 keys_zone=zone_a:100m
                 max_size=10g inactive=60m
                 use_temp_path=off;

server {
    location / {
        proxy_cache                   zone_a;
        proxy_cache_key               "$scheme$request_method$host$request_uri";
        proxy_cache_valid             200 302 10m;
        proxy_cache_valid             404 1m;
        proxy_cache_use_stale         error timeout updating http_500 http_502;
        proxy_cache_lock              on;
        proxy_cache_background_update on;
        add_header X-Cache-Status     $upstream_cache_status;
        proxy_pass                    http://app;
    }
}`,
    chips: ["proxy_cache_path", "proxy_cache", "proxy_cache_valid", "proxy_cache_use_stale", "proxy_cache_lock"],
  },
  {
    key: "limit",
    label: "限流保护",
    icon: <IconGauge size={16} />,
    title: "先保住服务，再谈体验",
    desc: "漏桶算法按 key 限速：burst 允许短时突发，nodelay 让突发放行而不排队。请求速率与并发连接分开计算，limit_conn 单独控制同时在途连接数，配合 429 状态码引导客户端退避。",
    points: [
      "limit_req_zone 的 key 可以是 IP、用户标识或任意变量",
      "burst 与 nodelay 组合平滑突发流量，避免误伤正常用户",
      "limit_req_dry_run 先在日志观测命中率再正式拦截",
    ],
    code: `http {
    limit_req_zone  $binary_remote_addr zone=per_ip:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_per_ip:10m;

    server {
        location /api/ {
            limit_req         zone=per_ip burst=20 nodelay;
            limit_req_status  429;

            limit_conn        conn_per_ip 20;
            limit_conn_status 429;

            proxy_pass        http://app;
        }
    }
}`,
    chips: ["limit_req_zone", "limit_req", "limit_req_dry_run", "limit_conn_zone", "limit_conn"],
  },
  {
    key: "tls",
    label: "TLS 与 HTTP/3",
    icon: <IconLockKey size={16} />,
    title: "握手的开销，省在会话复用上",
    desc: "TLS 1.3、共享会话缓存与 OCSP 装订把每次握手的往返压到最低。同一个 443 端口可以同时监听 QUIC 与 TCP：支持 HTTP/3 的客户端走 UDP，其余自动降级到 HTTP/2。",
    points: [
      "ssl_session_cache shared 让所有 worker 共用会话票据",
      "ssl_stapling 由 nginx 代取 OCSP 响应，客户端不必外连",
      "listen 443 quic reuseport 与 http2 on 在同端口并存",
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
    icon: <IconShareNetwork size={16} />,
    title: "TCP 与 UDP 也能被编排",
    desc: "stream 块不解析 HTTP，只做四层转发。配合 ssl_preread 读出 ClientHello 里的 SNI，一台 nginx 就能按域名把加密流量分给不同后端，全程不解密，证书继续留在后端。",
    points: [
      "stream 支持 TCP 与 UDP，负载均衡策略与 HTTP 层一致",
      "ssl_preread 在不解密的前提下读取 SNI 与 ALPN",
      "proxy_protocol 把真实源地址透传给后端服务",
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
    icon: <IconPulse size={16} />,
    title: "每个请求都留下可查的痕迹",
    desc: "一条访问日志可以带上总耗时、上游耗时、缓存状态与实际命中的上游地址；stub_status 暴露实时连接计数供监控抓取；需要链路追踪时，otel 模块可直接把 span 推给 OpenTelemetry 后端。",
    points: [
      "log_format 自定义字段，$request_time 定位慢请求",
      "$upstream_cache_status 清晰区分 HIT、MISS 与 STALE",
      "stub_status 只暴露实时连接计数，配合 allow 与 deny 收紧权限",
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

type FlowProfile = {
  key: "static" | "api" | "limit";
  label: string;
  clientIndex: number;
  upstreamIndex: number | null;
  activeStages: string[];
  blockedStage?: string;
  summary: string;
};

const FLOW_PROFILES: FlowProfile[] = [
  {
    key: "static",
    label: "静态资源",
    clientIndex: 0,
    upstreamIndex: 2,
    activeStages: ["accept", "ssl_handshake", "server_name", "location", "proxy_cache"],
    summary: "200 OK · cache HIT · 0.4ms",
  },
  {
    key: "api",
    label: "API 代理",
    clientIndex: 1,
    upstreamIndex: 0,
    activeStages: ["accept", "ssl_handshake", "server_name", "location", "limit_req", "proxy_cache", "upstream"],
    summary: "200 OK · app01 · 12.8ms",
  },
  {
    key: "limit",
    label: "触发限流",
    clientIndex: 2,
    upstreamIndex: null,
    activeStages: ["accept", "ssl_handshake", "server_name", "location"],
    blockedStage: "limit_req",
    summary: "429 Too Many Requests · 未回源 · 0.1ms",
  },
];

const PIPELINE = [
  {
    cmd: "accept",
    title: "收下连接",
    note: "事件循环从 epoll 或 kqueue 取出就绪的 socket",
    tip: "排查入口：连接排队或偶发建连超时时，先核对 worker_connections 与系统 somaxconn 队列上限。",
  },
  {
    cmd: "ssl_handshake",
    title: "TLS 握手",
    note: "优先复用会话票据，1 RTT 甚至 0 RTT 完成",
    tip: "排查入口：开启 ssl_session_cache shared 可跨 worker 复用票据，将 TLS 握手延迟压到最低。",
  },
  {
    cmd: "server_name",
    title: "选定虚拟主机",
    note: "按 SNI 与 Host 匹配对应 server 块",
    tip: "排查入口：多域名同端口串台时，检查精确主机名顺序、通配符优先级与 default_server 兜底配置。",
  },
  {
    cmd: "location",
    title: "匹配路由",
    note: "精确、前缀或正则规则决定请求处理分支",
    tip: "排查入口：精确匹配 = 优先于 ^~ 与正则 ~，路由落偏通常源于正则规则覆盖了前缀匹配。",
  },
  {
    cmd: "limit_req",
    title: "限流过闸",
    note: "限速、并发限制与子请求鉴权发生在回源之前",
    tip: "排查入口：上线拦截策略前先打开 limit_req_dry_run on，在日志观察命中分布再正式启用 429。",
  },
  {
    cmd: "proxy_cache",
    title: "检索缓存",
    note: "共享内存索引命中后直接回写，未命中再回源",
    tip: "排查入口：在响应头写入 $upstream_cache_status，通过 HIT、MISS、STALE 直接定位回源原因。",
  },
  {
    cmd: "upstream",
    title: "转发上游",
    note: "从连接池取一条 keepalive 长连接等待响应",
    tip: "排查入口：同时记录 $request_time 与 $upstream_response_time，迅速区分慢在客户端还是上游服务。",
  },
  {
    cmd: "sendfile",
    title: "零拷贝回写",
    note: "内核态直传文件句柄，按响应类型决定是否压缩",
    tip: "排查入口：静态分发打开 sendfile on 与 tcp_nopush on，减少用户态拷贝并合并响应头与文件首包。",
  },
];

const REPLACE_ROWS: [string, string, string][] = [
  ["流量分发", "硬件或软件负载均衡器", "upstream app { least_conn; }"],
  ["入口代理", "独立的反向代理进程", "proxy_pass http://app;"],
  ["安全闸口", "API 网关限流与鉴权组件", "limit_req …  auth_request /auth"],
  ["边缘缓存", "静态内容缓存层（Varnish 等）", "proxy_cache zone_a;"],
  ["传输加密", "独立 TLS 终结器", "listen 443 ssl;  listen 443 quic;"],
  ["四层转发", "四层负载均衡与端口转发", "stream { proxy_pass …; }"],
  ["资源托管", "静态文件服务器", "root /var/www;  sendfile on;"],
  ["流量实验", "灰度与 A/B 分流组件", "split_clients $cookie_uid $ver { … }"],
];

const SCENARIOS = [
  {
    tag: "静态与边缘",
    title: "前端产物与图片站点",
    desc: "构建产物直接托管，gzip_static 直接输出预压缩文件；代理层叠加缓存后，回源只发生在新版本发布那一刻。",
    cmd: "gzip_static on",
    icon: <IconLightning size={20} />,
    spanClass: "lp-scn-wide",
  },
  {
    tag: "API 网关",
    title: "鉴权、限流与路由收在一处",
    desc: "auth_request 发起鉴权子请求，通过才放行；限流与头部改写留在同一个 location 里，业务服务只关心自身接口。",
    cmd: "auth_request /auth",
    icon: <IconLockKey size={20} />,
    spanClass: "lp-scn-narrow",
  },
  {
    tag: "微服务入口",
    title: "上游连接池与故障摘除",
    desc: "连接池复用长连接，proxy_next_upstream 在遇到 502 或超时时自动换节点，节点恢复后靠被动回探重新入池。",
    cmd: "proxy_next_upstream",
    icon: <IconArrowsLeftRight size={20} />,
    spanClass: "lp-scn-narrow",
  },
  {
    tag: "灰度发布",
    title: "按稳定比例切分 A/B 流量",
    desc: "split_clients 按百分比把流量哈希切分到不同上游集群，key 绑定 Cookie 或客户端地址，确保同一用户持续命中同一版本。",
    cmd: "split_clients",
    icon: <IconScales size={20} />,
    spanClass: "lp-scn-wide",
  },
  {
    tag: "长连接",
    title: "WebSocket 与 SSE 推送",
    desc: "透传 Upgrade 请求头并放宽读超时，双向长连接即可穿过代理；心跳频率由业务后端控制，nginx 只确保链路稳定。",
    cmd: "proxy_read_timeout",
    icon: <IconPulse size={20} />,
    spanClass: "lp-scn-half",
  },
  {
    tag: "四层代理",
    title: "数据库与非 HTTP TCP 服务",
    desc: "MySQL、Redis 与 gRPC 走 stream 模块转发，按 SNI 或监听端口分流，同时在入口叠加来源 IP 白名单控制。",
    cmd: "proxy_protocol on",
    icon: <IconShareNetwork size={20} />,
    spanClass: "lp-scn-half",
  },
];

const RELOAD_STEPS = [
  {
    title: "修改配置区块",
    desc: "只调整需要变更的 server 或 location 区块，其余配置原样保留。",
    lines: [1],
    master: "PID 1042 · 运行中",
    oldWorker: "4 个 worker 服务中",
    newWorker: "尚未拉起",
    note: "配置文件修改仅落盘，运行中的 master 与 worker 进程继续按旧规则提供服务。",
  },
  {
    title: "配置语法校验",
    desc: "预先校验语法、证书路径与端口占用；若发现错误立即终止，线上流量不受影响。",
    lines: [1],
    master: "PID 1042 · 运行中",
    oldWorker: "4 个 worker 正常服务",
    newWorker: "离线预校验",
    note: "先执行校验命令检查语法、证书路径与端口占用；若校验失败立即退出，线上流量零风险。",
  },
  {
    title: "平滑重载配置",
    desc: "master 进程拉起加载新配置的 worker 接收新连接，老 worker 处理完在途请求后优雅退出。",
    lines: [2],
    master: "PID 1042 · HUP 重载",
    oldWorker: "排空在途请求后退出",
    newWorker: "4 个新 worker 接管新连接",
    note: "新连接立刻进入新版 worker，老 worker 把已建立连接处理完毕再退出，实现在线零中断。",
  },
  {
    title: "热升级二进制",
    desc: "通过信号平滑拉起新版本 master 并交接监听句柄，实现零停机版本升级。",
    lines: [7, 8, 9],
    master: "PID 1042 交接至 1089",
    oldWorker: "WINCH 信号优雅下线",
    newWorker: "新版 worker 继承 socket",
    note: "通过 USR2 拉起新版 master 继承监听句柄，WINCH 令旧 worker 排空交班，QUIT 收尾老进程。",
  },
];

const FAQ_ITEMS = [
  {
    q: "NGINX 为什么能用极少内存撑起高并发连接？",
    a: "它采用异步非阻塞的事件驱动架构。单个 worker 进程在 Linux 上通过 epoll、在 BSD 与 macOS 上通过 kqueue 复用大量 socket，连接状态保存在轻量状态机里，不会为每个客户端分配独立线程或栈内存。",
  },
  {
    q: "什么时候应该用 proxy_pass，什么时候用 stream 四层代理？",
    a: "需要按域名、路径、请求头、Cookie 路由或做内容缓存与限流时，使用 http 块下的 proxy_pass；当流量本身不是 HTTP，例如 MySQL、Redis、gRPC 透传或按 SNI 分流加密连接时，使用 stream 块。",
  },
  {
    q: "修改配置后执行平滑重载会断开现有用户连接吗？",
    a: "不会。执行重载命令前先进行语法与证书路径校验；重载时 master 进程会启动加载新配置的 worker 接收新连接，老 worker 则在把在途请求全部响应完毕后优雅退出。",
  },
  {
    q: "开源版本身支持 HTTP/3 与 QUIC 吗？",
    a: "支持。NGINX 自 1.25.0 起已将 HTTP/3 与 QUIC 模块合入主线。在同一端口同时开启 SSL 与 QUIC 监听并通过响应头通告协议支持后，客户端即可平滑升级或自动回退到 HTTP/2。",
  },
  {
    q: "需要限流或缓存时，必须额外引入 Redis 或 Varnish 吗？",
    a: "单机或单实例边缘节点不需要。limit_req_zone 与 proxy_cache 直接将限流桶计数与缓存索引保存在共享内存 zone 中，响应正文落盘存储，多个 worker 之间零锁共享状态。",
  },
  {
    q: "如何在不修改上游应用代码的前提下做灰度发布？",
    a: "使用内置的 split_clients 指令即可。它可以对请求中的 Cookie、用户标识或客户端地址做哈希分桶，按百分比把稳定比例的流量切到新版上游集群，无需改动业务代码。",
  },
];

const TUNE_CODE = `worker_processes      auto;
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
}`;

const RELOAD_CODE = `nginx -t                 # 先校验语法与证书路径
nginx -s reload          # 平滑重载：新老 worker 交接
nginx -s reopen          # 重开日志文件，配合 logrotate
nginx -V                 # 查看编译参数与已加载模块

# 二进制热升级（全程不断在线连接）
kill -USR2 $(cat /run/nginx.pid)         # 拉起新版 master
kill -WINCH $(cat /run/nginx.pid.oldbin) # 老 worker 交班
kill -QUIT $(cat /run/nginx.pid.oldbin)  # 老 master 退出`;

const INSTALL_CMD = `sudo apt install nginx
sudo systemctl enable --now nginx
curl -I localhost`;

const TAGLINE_LINES: string[][] = [
  ["把", "代理、", "缓存、", "限流", "与", "加密，"],
  ["收进", "同一份", "声明式", "配置，"],
  ["让", "每一次", "线上", "变更", "都", "不断", "连接。"],
];

function SecHead({
  idx,
  kicker,
  title,
  desc,
}: {
  idx: string;
  kicker: string;
  title: React.ReactNode;
  desc: string;
}) {
  return (
    <header className="lp-sec-head">
      <span className="lp-kicker">
        <b className="lp-kicker-n">{idx}</b>
        <span>{kicker}</span>
      </span>
      <h2>{title}</h2>
      <p>{desc}</p>
    </header>
  );
}

export default function Home() {
  const [tab, setTab] = useState(0);
  const [profileKey, setProfileKey] = useState<FlowProfile["key"]>("static");
  const [paused, setPaused] = useState(false);
  const [selectedStage, setSelectedStage] = useState(5);
  const [reloadStep, setReloadStep] = useState(2);

  const tablistRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);

  const activeProfile = FLOW_PROFILES.find((p) => p.key === profileKey) ?? FLOW_PROFILES[0];
  const currentStage = PIPELINE[selectedStage];
  const activeReload = RELOAD_STEPS[reloadStep];

  /* 隐藏标签面板支持浏览器页内查找 (hidden="until-found" + beforematch) */
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    panelRefs.current.forEach((panel, index) => {
      if (!panel) return;
      if (index === tab) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "until-found");
      }
      const onMatch = () => {
        setTab(index);
      };
      panel.addEventListener("beforematch", onMatch);
      cleanups.push(() => panel.removeEventListener("beforematch", onMatch));
    });
    return () => cleanups.forEach((fn) => fn());
  }, [tab]);

  /* 不支持 scroll() 时间线的浏览器使用 IntersectionObserver 显示标签栏边缘渐隐 */
  useEffect(() => {
    const scroller = tablistRef.current;
    if (!scroller || typeof IntersectionObserver === "undefined") return;
    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline", "scroll()")) return;

    const first = scroller.firstElementChild;
    const last = scroller.lastElementChild;
    if (!first || !last) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, intersectionRatio } of entries) {
          scroller.classList.toggle(
            target === first ? "more-start" : "more-end",
            intersectionRatio < 1
          );
        }
      },
      { root: scroller, threshold: 1, rootMargin: "1px" }
    );

    observer.observe(first);
    observer.observe(last);
    return () => observer.disconnect();
  }, []);

  function selectTab(nextIndex: number, moveFocus = false) {
    setTab(nextIndex);
    const btn = tabRefs.current[nextIndex];
    if (btn) {
      if (moveFocus) btn.focus();
      try {
        btn.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          container: "nearest",
        } as ScrollIntoViewOptions);
      } catch {
        btn.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  }

  function onTabKey(e: React.KeyboardEvent) {
    let next = tab;
    if (e.key === "ArrowRight") {
      next = (tab + 1) % CAPS.length;
    } else if (e.key === "ArrowLeft") {
      next = (tab - 1 + CAPS.length) % CAPS.length;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = CAPS.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    selectTab(next, true);
  }

  return (
    <div className="lp">
      {/* ================= 01 HERO ================= */}
      <section className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-eyebrow">
                <i aria-hidden="true" />
                <span>事件驱动 · 异步非阻塞 · HTTP/3</span>
              </span>

              <h1 className="lp-h1">
                <span className="lp-h1-text">
                  一个进程，
                  <br />
                  扛住整站流量
                </span>
              </h1>

              <p className="lp-lead">
                反向代理、负载均衡、内容缓存、请求限流、TLS 卸载与四层转发。NGINX 把边缘所需的全部能力收进单个二进制，改一份 <code>nginx.conf</code> 即可重新编排整条流量链路。
              </p>

              <div className="lp-cta-row">
                <a href="#capabilities" className="lp-btn-main">
                  查看七大核心能力
                </a>
                <Link to="/docs/install" className="lp-link-tertiary">
                  阅读安装与上手文档
                </Link>
              </div>

              <dl className="lp-proof-bar">
                <div className="lp-proof-item">
                  <dt>开源起点</dt>
                  <dd>2004</dd>
                </div>
                <div className="lp-proof-item">
                  <dt>官方模块</dt>
                  <dd>{MODULES.length}</dd>
                </div>
                <div className="lp-proof-item">
                  <dt>内置指令</dt>
                  <dd>{DIRECTIVE_INDEX.length}</dd>
                </div>
                <div className="lp-proof-item">
                  <dt>传输协议</dt>
                  <dd>HTTP/3</dd>
                </div>
              </dl>
            </div>

            {/* 交互式流量检视面板 */}
            <div
              className="lp-board"
              role="region"
              aria-label="请求流经 nginx 的交互式状态面板"
              data-paused={paused ? "true" : "false"}
            >
              <div className="lp-board-head">
                <div className="lp-board-status">
                  <span className="lp-live">
                    <i aria-hidden="true" />
                    <span>实时路径</span>
                  </span>
                  <span className="lp-board-mono">worker #1 · epoll · 单线程事件循环</span>
                </div>

                <button
                  type="button"
                  className="lp-board-ctrl"
                  onClick={() => setPaused((p) => !p)}
                >
                  {paused ? <IconPlay size={14} /> : <IconPause size={14} />}
                  <span>{paused ? "播放" : "暂停"}</span>
                </button>
              </div>

              <div className="lp-board-profiles" role="group" aria-label="选择请求场景">
                {FLOW_PROFILES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className={`lp-profile-btn ${profileKey === p.key ? "is-selected" : ""}`}
                    aria-pressed={profileKey === p.key}
                    onClick={() => setProfileKey(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="lp-flow">
                <div className="lp-clients">
                  {[
                    ["浏览器", "/index.html"],
                    ["移动端", "/api/orders"],
                    ["压测脚本", "/api/login"],
                  ].map(([name, path], i) => (
                    <div
                      className={`lp-node ${activeProfile.clientIndex === i ? "is-active" : ""}`}
                      key={name}
                    >
                      <b>{name}</b>
                      <span>{path}</span>
                    </div>
                  ))}
                </div>

                <div className="lp-traces" aria-hidden="true">
                  {[0, 1, 2].map((idx) => (
                    <span
                      key={idx}
                      className="lp-trace-line"
                      data-active={activeProfile.clientIndex === idx ? "true" : "false"}
                    />
                  ))}
                </div>

                <div className="lp-core">
                  <div className="lp-core-tag">nginx</div>
                  {PIPELINE.slice(0, 7).map((stage, i) => {
                    const isBlocked = activeProfile.blockedStage === stage.cmd;
                    const isActive = activeProfile.activeStages.includes(stage.cmd);
                    const state = isBlocked ? "blocked" : isActive ? "active" : "bypass";
                    return (
                      <div className="lp-stage" key={stage.cmd} data-state={state}>
                        <div className="lp-stage-top">
                          <span className="lp-stage-name">{stage.cmd}</span>
                          <span className="lp-stage-badge">
                            {isBlocked ? "429" : isActive ? "经过" : "跳过"}
                          </span>
                        </div>
                        <span className="lp-bar">
                          <i style={{ "--bar-delay": `${i * 180}ms` } as React.CSSProperties} />
                        </span>
                      </div>
                    );
                  })}
                  <div className="lp-core-hit">{activeProfile.summary}</div>
                </div>

                <div className="lp-traces" aria-hidden="true">
                  {[0, 1, 2].map((idx) => (
                    <span
                      key={idx}
                      className="lp-trace-line"
                      data-active={activeProfile.upstreamIndex === idx ? "true" : "false"}
                      data-blocked={activeProfile.upstreamIndex === null ? "true" : undefined}
                    />
                  ))}
                </div>

                <div className="lp-ups">
                  {[
                    ["app01", "10.0.0.11"],
                    ["app02", "10.0.0.12"],
                    ["cache01", "10.0.1.11"],
                  ].map(([name, ip], i) => (
                    <div
                      className={`lp-node ${activeProfile.upstreamIndex === i ? "is-active" : ""}`}
                      key={name}
                    >
                      <b>{name}</b>
                      <span>{ip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lp-board-foot">
                <span>TLS 1.3 会话复用</span>
                <span>上游 keepalive 连接池</span>
                <span>sendfile 零拷贝</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lp-hero-strip">
          <div className="lp-wrap lp-strip-inner">
            {[
              ["事件驱动", "epoll 与 kqueue"],
              ["七层代理", "HTTP/1.1 · 2 · 3"],
              ["四层代理", "TCP 与 UDP"],
              ["动态模块", "load_module"],
              ["脚本扩展", "njs 与 JavaScript"],
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

      {/* ================= 02 七大能力 ================= */}
      <section className="lp-section lp-band-black" id="capabilities">
        <div className="lp-wrap">
          <Reveal>
            <SecHead
              idx="01"
              kicker="能力"
              title="七种角色，一份配置"
              desc="下面每一段都是可直接写入 nginx.conf 的真实配置，而非概念伪代码。切换左侧分类或使用方向键查看实现方式。"
            />

            <div
              ref={tablistRef}
              className="lp-tabs"
              role="tablist"
              aria-label="核心能力分类"
              onKeyDown={onTabKey}
            >
              {CAPS.map((c, i) => (
                <button
                  key={c.key}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  id={`cap-tab-${c.key}`}
                  role="tab"
                  aria-selected={i === tab}
                  tabIndex={i === tab ? 0 : -1}
                  className="lp-tab"
                  onClick={() => selectTab(i)}
                >
                  {c.icon}
                  <span>{c.label}</span>
                </button>
              ))}
            </div>

            <div className="lp-panels-stack">
              {CAPS.map((c, i) => (
                <div
                  key={c.key}
                  ref={(el) => {
                    panelRefs.current[i] = el;
                  }}
                  className="lp-panel-slot"
                  role="tabpanel"
                  id={`cap-panel-${c.key}`}
                  aria-labelledby={`cap-tab-${c.key}`}
                  hidden={i !== tab}
                >
                  <div className="lp-panel-inner">
                    <div className="lp-panel-text">
                      <h3>{c.title}</h3>
                      <p>{c.desc}</p>
                      <ul className="lp-points" role="list">
                        {c.points.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                      <div className="lp-chips" aria-label="相关指令">
                        {c.chips.map((d) => (
                          <span key={d} className="lp-chip">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <NginxCode code={c.code} title="nginx.conf" copyLabel="复制配置" />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 03 一套顶一套 ================= */}
      <section className="lp-section lp-band-elevated" id="coverage">
        <div className="lp-wrap">
          <Reveal>
            <SecHead
              idx="02"
              kicker="覆盖面"
              title="它替掉的，是一整排独立中间件"
              desc="同一份二进制把这些入口职责全部收敛：少一次跨进程跳转、少一套监控探针、少一份配置同步，线上故障点也随之减少。"
            />

            <div className="lp-table-wrap">
              <table className="lp-replace-table">
                <caption className="visually-hidden">NGINX 替代传统中间件的配置对照表</caption>
                <thead>
                  <tr>
                    <th scope="col" className="lp-col-legacy">
                      没有 nginx 时需要部署的组件
                    </th>
                    <th scope="col" className="lp-col-nginx">
                      写进 nginx.conf 的等效能力
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {REPLACE_ROWS.map(([role, what, cmd], idx) => (
                    <tr key={what}>
                      <td className="lp-replace-what">
                        <span className="lp-replace-idx">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="lp-replace-role">{role}</span>
                        <span className="lp-replace-name">{what}</span>
                      </td>
                      <td>
                        <code className="lp-replace-cmd">{cmd}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="lp-table-summary">
                <span className="lp-table-sum-pill">8 类独立中间件</span>
                <span className="lp-table-sum-text">
                  全部收敛进 1 份声明式 nginx.conf，减少跨进程网络跳转与配置漂移
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 04 品牌宣言逐词显现 ================= */}
      <section className="lp-section lp-band-black lp-tagline-section" id="statement">
        <div className="lp-wrap">
          <span className="lp-kicker">
            <b className="lp-kicker-n">03</b>
            <span>设计哲学</span>
          </span>
          <TaglineReveal lines={TAGLINE_LINES} />
        </div>
      </section>

      {/* ================= 05 交互式请求管道 ================= */}
      <section className="lp-section lp-band-elevated" id="pipeline">
        <div className="lp-wrap">
          <Reveal>
            <SecHead
              idx="04"
              kicker="一条请求的一生"
              title="从 socket 就绪到第一个字节回写"
              desc="点击下方任意处理阶段，查看请求在单线程事件循环中的推进轨迹，以及对应的线上排障入口。"
            />

            <div className="lp-pipe-frame">
              <ol className="lp-pipe" role="list">
                {PIPELINE.map((s, i) => {
                  const isCurrent = selectedStage === i;
                  const isPassed = i <= selectedStage;
                  return (
                    <li key={s.cmd} className="lp-pipe-cell">
                      <button
                        type="button"
                        className="lp-pipe-step"
                        aria-pressed={isCurrent}
                        data-passed={isPassed ? "true" : "false"}
                        data-current={isCurrent ? "true" : "false"}
                        onClick={() => setSelectedStage(i)}
                      >
                        <span className="lp-pipe-top">
                          <span className="lp-pipe-n">{String(i + 1).padStart(2, "0")}</span>
                          <span className="lp-pipe-dot" aria-hidden="true" />
                        </span>
                        <b>{s.title}</b>
                        <code className="lp-pipe-cmd">{s.cmd}</code>
                        <p>{s.note}</p>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="lp-pipe-readout" role="status" aria-live="polite">
              <span className="lp-pipe-readout-tag">
                阶段 {String(selectedStage + 1).padStart(2, "0")} · {currentStage.cmd}
              </span>
              <p className="lp-pipe-readout-text">{currentStage.tip}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 06 架构对比与调优 ================= */}
      <section className="lp-section lp-band-black" id="architecture">
        <div className="lp-wrap">
          <Reveal>
            <SecHead
              idx="05"
              kicker="架构模型"
              title="它不是“更快的进程池”，而是另一种模型"
              desc="高并发吞吐的差距，并不来自更取巧的代码，而来自不为大量空闲与慢速连接分配昂贵的线程栈与上下文切换开销。"
            />

            <div className="lp-vs">
              <article className="lp-vs-card is-legacy">
                <div className="lp-vs-head">
                  <span className="lp-vs-mark" aria-hidden="true">
                    <IconX size={14} />
                  </span>
                  <h3>传统模型：每连接占用一份执行单元</h3>
                </div>
                <ul className="lp-vs-list" role="list">
                  <li>一个连接独占一个进程或线程，栈内存随并发数线性攀升</li>
                  <li>高并发下上下文切换吞噬 CPU，慢速客户端很容易占死线程池</li>
                  <li>要扛住更多并发连接，往往只能被动加机器或堆内存</li>
                </ul>
                <div className="lp-vs-foot">连接上限 ≈ 可用内存 ÷ 单连接开销</div>
              </article>

              <article className="lp-vs-card is-nginx">
                <div className="lp-vs-head">
                  <span className="lp-vs-mark" aria-hidden="true">
                    <IconCheck size={14} />
                  </span>
                  <h3>事件循环：单个 worker 管住上万个 socket</h3>
                </div>
                <ul className="lp-vs-list" role="list">
                  <li>单线程非阻塞事件循环，通过 epoll 或 kqueue 等待就绪通知</li>
                  <li>连接上下文存在轻量状态机里，慢连接不阻塞同进程的其他请求</li>
                  <li>限流计数、缓存索引放在共享内存 zone，跨 worker 一致访问</li>
                </ul>
                <div className="lp-vs-foot">连接上限 ≈ worker_processes × worker_connections</div>
              </article>
            </div>

            <div className="lp-tune">
              <div className="lp-tune-copy">
                <h3>把这两组内核参数调对，压测曲线就会改变</h3>
                <p>
                  默认配置面向兼容性，<code>worker_connections</code> 只有 512，进程数也需要显式跟随 CPU 核数。上线前按核数与文件描述符上限重算一遍，再打开零拷贝发送，静态吞吐会立刻上一个台阶。
                </p>
                <ul className="lp-points" role="list">
                  <li>
                    <code>worker_processes auto</code> 自动对齐核数，减少跨核调度抖动
                  </li>
                  <li>
                    <code>worker_rlimit_nofile</code> 需高于单个进程实际并发打开的 fd 总数
                  </li>
                  <li>
                    <code>keepalive_timeout</code> 控制空闲长连接保持复用的时长窗口
                  </li>
                </ul>
              </div>

              <NginxCode code={TUNE_CODE} title="nginx.conf · 运行时调优" copyLabel="复制配置" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 07 真实场景 Bento ================= */}
      <section className="lp-section lp-band-elevated" id="scenarios">
        <div className="lp-wrap">
          <Reveal>
            <SecHead
              idx="06"
              kicker="生产场景"
              title="它在生产环境里真正承担的位置"
              desc="同一份二进制在不同边界换成不同配置。既能做百万级边缘静态分发，也能充当微服务网关与四层数据库入口。"
            />

            <div className="lp-scn-grid">
              {SCENARIOS.map((s, i) => (
                <article className={`lp-scn ${s.spanClass}`} key={s.title}>
                  <div className="lp-scn-top">
                    <div className="lp-scn-meta">
                      <span className="lp-scn-icon">{s.icon}</span>
                      <span className="lp-scn-tag">{s.tag}</span>
                    </div>
                    <span className="lp-scn-n">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <div className="lp-scn-foot">
                    <code>{s.cmd}</code>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 08 平滑重载 ================= */}
      <section className="lp-section lp-band-black" id="reload">
        <div className="lp-wrap">
          <Reveal>
            <SecHead
              idx="07"
              kicker="日常运维"
              title="改配置，不用断线上连接"
              desc="点击左侧任一阶段，查看对应的命令信号与 master / worker 进程交接状态。reload 不是粗暴重启，老连接处理完毕才会退场。"
            />

            <div className="lp-reload">
              <ol className="lp-steps" role="list">
                {RELOAD_STEPS.map((s, i) => (
                  <li key={s.title}>
                    <button
                      type="button"
                      className="lp-step-btn"
                      aria-pressed={reloadStep === i}
                      onClick={() => setReloadStep(i)}
                    >
                      <span className="lp-step-n">{String(i + 1).padStart(2, "0")}</span>
                      <span className="lp-step-body">
                        <b>{s.title}</b>
                        <span>{s.desc}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>

              <div className="lp-reload-right">
                <NginxCode
                  code={RELOAD_CODE}
                  title="shell · 运维常用命令"
                  copyLabel="复制命令"
                  highlightLines={activeReload.lines}
                />

                <div className="lp-handover-card" role="status" aria-live="polite">
                  <div className="lp-handover-grid">
                    <div className="lp-handover-cell">
                      <span>主控进程</span>
                      <b>{activeReload.master}</b>
                    </div>
                    <div className="lp-handover-cell">
                      <span>旧 worker</span>
                      <b>{activeReload.oldWorker}</b>
                    </div>
                    <div className="lp-handover-cell">
                      <span>新 worker</span>
                      <b>{activeReload.newWorker}</b>
                    </div>
                  </div>
                  <p className="lp-handover-note">{activeReload.note}</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 09 高频工程问答 ================= */}
      <section className="lp-section lp-band-elevated" id="faq">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-faq-grid">
              <div className="lp-faq-intro">
                <SecHead
                  idx="08"
                  kicker="常见问题"
                  title={
                    <>
                      上线与排查前，
                      <br />
                      最常确认的六个细节
                    </>
                  }
                  desc="覆盖线程模型、七层与四层边界、平滑重载机制与缓存限流选型的常见疑问。"
                />
                <div className="lp-faq-more">
                  <Link to="/docs/overview" className="lp-link-tertiary">
                    深入阅读完整中文文档
                  </Link>
                </div>
              </div>

              <dl className="lp-faq-list">
                {FAQ_ITEMS.map((item, idx) => (
                  <div className="lp-faq-item" key={item.q}>
                    <dt>
                      <span className="lp-faq-n">{String(idx + 1).padStart(2, "0")}</span>
                      <span>{item.q}</span>
                    </dt>
                    <dd>{item.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 10 事实条与收尾 ================= */}
      <section className="lp-facts">
        <div className="lp-wrap">
          <div className="lp-facts-frame">
            <div className="lp-facts-inner">
              {[
                ["2004", "首次开源发布"],
                ["BSD", "二条款开源许可"],
                [`${MODULES.length}`, "个官方模块"],
                [`${DIRECTIVE_INDEX.length}`, "条内置指令"],
                ["3", "HTTP/1.1 · 2 · 3"],
                ["njs", "JavaScript 扩展"],
              ].map(([n, l]) => (
                <div className="lp-fact" key={l}>
                  <b>{n}</b>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-end">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-end-inner">
              <div>
                <span className="lp-kicker">
                  <b className="lp-kicker-n">09</b>
                  <span>立即上手</span>
                </span>
                <h2>起一个 worker，接住下一波流量</h2>
                <p>
                  安装包只需一行命令，后续所有配置变更均可先离线校验再零中断重载。
                </p>
              </div>

              <div className="lp-end-card">
                <pre className="lp-end-pre" tabIndex={0}>
                  <code>
                    {INSTALL_CMD.split("\n").map((line, idx, arr) => (
                      <span key={idx} className="lp-end-line">
                        <span className="lp-prompt-sym" aria-hidden="true">
                          ${" "}
                        </span>
                        <span>{renderCodeLine(line, idx)}</span>
                        {idx < arr.length - 1 ? "\n" : ""}
                      </span>
                    ))}
                  </code>
                </pre>
                <div className="lp-end-actions">
                  <CopyAction text={INSTALL_CMD} label="复制命令" />
                  <span className="lp-end-hint">
                    Debian 与 Ubuntu 示例，其余发行版包名略有差异
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
