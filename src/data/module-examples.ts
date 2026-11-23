// 常用模块的真实最小示例（按官方示例改写，可直接粘贴使用）
export const MODULE_EXAMPLES: Record<string, { title: string; code: string }> = {
  "http-limit-req": {
    title: "限制请求速率（漏桶）",
    code: `http {
    limit_req_zone $binary_remote_addr zone=perip:10m rate=10r/s;

    server {
        location /api/ {
            limit_req      zone=perip burst=20 nodelay;
            limit_req_status 429;
            proxy_pass     http://backend;
        }
    }
}`,
  },
  "http-limit-conn": {
    title: "限制并发连接数",
    code: `http {
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    server {
        location /download/ {
            limit_conn addr 10;
            limit_conn_status 429;
        }
    }
}`,
  },
  "http-proxy": {
    title: "反向代理并透传客户端信息",
    code: `location / {
    proxy_pass         http://backend;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}`,
  },
  "http-upstream": {
    title: "上游组：权重、备用、keepalive",
    code: `upstream backend {
    least_conn;
    server 10.0.0.11:8080 weight=5 max_fails=3 fail_timeout=10s;
    server 10.0.0.12:8080 weight=3;
    server 10.0.0.13:8080 backup;
    keepalive 32;
}`,
  },
  "http-gzip": {
    title: "压缩响应",
    code: `gzip              on;
gzip_vary         on;
gzip_min_length   1024;
gzip_comp_level   5;
gzip_proxied      any;
gzip_types        text/plain text/css application/json application/javascript text/xml application/xml;`,
  },
  "http-gzip-static": {
    title: "优先发送预压缩的 .gz",
    code: `location /static/ {
    gzip_static on;
    root /var/www;
}`,
  },
  "http-headers": {
    title: "缓存与安全响应头",
    code: `location ~* \\.(css|js|png|jpg|svg|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options "nosniff" always;
}`,
  },
  "http-rewrite": {
    title: "重定向与条件改写",
    code: `# 全站 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

# 旧路径迁移
location /old/ {
    rewrite ^/old/(.*)$ /new/$1 permanent;
}`,
  },
  "http-map": {
    title: "用 map 生成变量",
    code: `map $http_user_agent $is_bot {
    default        0;
    ~*(bot|crawler|spider)  1;
}

server {
    if ($is_bot) { return 403; }
}`,
  },
  "http-ssl": {
    title: "HTTPS 与会话缓存",
    code: `server {
    listen 443 ssl;
    http2 on;
    server_name example.com;

    ssl_certificate     /etc/nginx/certs/example.com.chained.crt;
    ssl_certificate_key /etc/nginx/certs/example.com.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
}`,
  },
  "http-v2": {
    title: "启用 HTTP/2",
    code: `server {
    listen 443 ssl;
    http2  on;          # 1.25.1 起用 http2 指令
    ssl_certificate     example.com.crt;
    ssl_certificate_key example.com.key;
}`,
  },
  "http-v3": {
    title: "启用 HTTP/3",
    code: `server {
    listen 443 quic reuseport;
    listen 443 ssl;
    http2  on;

    ssl_certificate     example.com.crt;
    ssl_certificate_key example.com.key;

    quic_retry     on;
    ssl_early_data on;
    quic_gso       on;

    add_header Alt-Svc 'h3=":443"; ma=86400';
}`,
  },
  "http-realip": {
    title: "从代理头还原真实 IP",
    code: `set_real_ip_from 10.0.0.0/8;
set_real_ip_from 172.16.0.0/12;
real_ip_header   X-Forwarded-For;
real_ip_recursive on;`,
  },
  "http-auth-basic": {
    title: "Basic 认证",
    code: `location /admin/ {
    auth_basic           "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
}`,
  },
  "http-auth-request": {
    title: "子请求鉴权",
    code: `location /private/ {
    auth_request     /auth;
    auth_request_set $auth_user $upstream_http_x_user;
    proxy_set_header X-User $auth_user;
    proxy_pass       http://backend;
}

location = /auth {
    internal;
    proxy_pass http://authserver/verify;
}`,
  },
  "http-auth-jwt": {
    title: "校验 JWT",
    code: `location /api/ {
    auth_jwt          "api";
    auth_jwt_key_file /etc/nginx/jwt.key;
    proxy_pass        http://backend;
}`,
  },
  "http-stub-status": {
    title: "基础状态页",
    code: `location = /basic_status {
    stub_status;
    allow 127.0.0.1;
    deny  all;
}`,
  },
  "http-slice": {
    title: "大文件切片缓存",
    code: `proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=big:10m max_size=10g;

location /media/ {
    slice              1m;
    proxy_cache        big;
    proxy_cache_key    $uri$is_args$args$slice_range;
    proxy_set_header   Range $slice_range;
    proxy_cache_valid  200 206 1h;
    proxy_pass         http://origin;
}`,
  },
  "http-mirror": {
    title: "流量镜像到影子环境",
    code: `location / {
    mirror        /mirror;
    mirror_request_body on;
    proxy_pass    http://production;
}

location = /mirror {
    internal;
    proxy_pass http://staging$request_uri;
}`,
  },
  "http-sub": {
    title: "替换响应内容",
    code: `location / {
    sub_filter      '</head>' '<script src="/x.js"></script></head>';
    sub_filter_once off;
    proxy_pass      http://backend;
}`,
  },
  "http-referer": {
    title: "防盗链",
    code: `location ~* \\.(gif|jpg|png|mp4)$ {
    valid_referers none blocked server_names *.example.com;
    if ($invalid_referer) { return 403; }
}`,
  },
  "http-autoindex": {
    title: "目录列表",
    code: `location /files/ {
    autoindex            on;
    autoindex_exact_size off;
    autoindex_localtime  on;
}`,
  },
  "http-log": {
    title: "自定义访问日志",
    code: `log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                 '$status $body_bytes_sent "$http_referer" '
                 '"$http_user_agent" rt=$request_time uct=$upstream_connect_time';

access_log /var/log/nginx/access.log main buffer=32k flush=5s;`,
  },
  "http-fastcgi": {
    title: "代理到 PHP-FPM",
    code: `location ~ \\.php$ {
    include        fastcgi_params;
    fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_pass   127.0.0.1:9000;
    fastcgi_read_timeout 60s;
}`,
  },
  "http-grpc": {
    title: "gRPC 代理",
    code: `grpc {
    server {
        listen 50051 http2;
    }
}

http {
    server {
        listen 443 ssl;
        http2  on;
        location /helloworld.Greeter/ {
            grpc_pass grpc://127.0.0.1:50051;
        }
    }
}`,
  },
  "http-image-filter": {
    title: "按参数缩放图片",
    code: `location /img/ {
    image_filter resize  $arg_w $arg_h;
    image_filter_jpeg_quality 85;
    image_filter_buffer 10M;
}`,
  },
  "http-hls": {
    title: "点播 HLS",
    code: `location /hls/ {
    root /var/www;
    hls;
    hls_fragment      5s;
    hls_playlist_length 30s;
    hls_types mp4 m4v m4a mov;
}`,
  },
  "http-mp4": {
    title: "MP4 伪流",
    code: `location /videos/ {
    mp4;
    mp4_buffer_size     1m;
    mp4_max_buffer_size 5m;
}`,
  },
  "http-dav": {
    title: "WebDAV 上传",
    code: `location /dav/ {
    root      /var/www;
    dav_methods PUT DELETE MKCOL COPY MOVE;
    dav_access  user:rw group:r all:r;
    create_full_put_path on;
    client_max_body_size 0;
}`,
  },
  "http-secure-link": {
    title: "带签名的临时链接",
    code: `location /download/ {
    secure_link         $arg_st,$arg_e;
    secure_link_md5     "$secure_link_expires$uri$remote_addr secret";
    if ($secure_link = "") { return 403; }
    if ($secure_link = "0") { return 410; }
}`,
  },
  "http-split-clients": {
    title: "A/B 分流",
    code: `split_clients "\${remote_addr}AAA" $variant {
    10%   new_version;
    *     old_version;
}

location / {
    proxy_pass http://$variant;
}`,
  },
  "http-geo": {
    title: "按来源地生成变量",
    code: `geo $is_internal {
    default        0;
    10.0.0.0/8     1;
    192.168.0.0/16 1;
}

server {
    location / {
        if ($is_internal) { add_header X-Internal 1; }
    }
}`,
  },
  "http-js": {
    title: "njs 变量处理器",
    code: `load_module modules/ngx_http_js_module.so;

http {
    js_import main from conf.d/http.js;
    js_set $req_id main.reqId;

    server {
        listen 80;
        add_header X-Request-Id $req_id;
        location / { proxy_pass http://backend; }
    }
}`,
  },
  "http-keyval": {
    title: "键值变量与 API 配合",
    code: `keyval_zone zone=limits:1m state=/var/lib/nginx/limits.json;
keyval $arg_key $limit_value zone=limits;

server {
    location /api/ {
        limit_req zone=perip burst=20;
        proxy_pass http://backend;
    }
}`,
  },
  "http-addition": {
    title: "追加页头页脚",
    code: `location / {
    add_before_body /before.html;
    add_after_body  /after.html;
    proxy_pass      http://backend;
}`,
  },
  "http-ssi": {
    title: "服务端包含",
    code: `location / {
    ssi         on;
    ssi_types   text/html;
}`,
  },
  "http-gunzip": {
    title: "为老客户端解压",
    code: `location / {
    gunzip            on;
    gunzip_buffers    16 8k;
    proxy_pass        http://backend;
}`,
  },
  "http-userid": {
    title: "签发用户标识 Cookie",
    code: `userid         on;
userid_name    uid;
userid_domain  example.com;
userid_path    /;
userid_expires 365d;`,
  },
  "http-acme": {
    title: "自动申请与续期证书",
    code: `# 需按官方文档编译 nginx_acme 模块
acme_issuer letsencrypt {
    uri         https://acme-v02.api.letsencrypt.org/directory;
    state_path  /var/lib/nginx/acme;
}

server {
    listen 443 ssl;
    server_name example.com;
    acme_certificate letsencrypt;
}`,
  },
  "http-oidc": {
    title: "OpenID Connect 登录",
    code: `location / {
    auth_oidc oidc_provider;
    proxy_pass http://backend;
}

# 提供方配置（含 issuer、client_id、client_secret 等）
# 详见官方模块页面`,
  },
  "http-internal-redirect": {
    title: "内部重定向",
    code: `location /a/ {
    internal_redirect /b$request_uri;
}

location /b/ {
    proxy_pass http://backend;
}`,
  },
  "http-upstream-hc": {
    title: "主动健康检查",
    code: `upstream backend {
    zone backend 64k;
    server 10.0.0.11:8080;
    server 10.0.0.12:8080;
}

server {
    location / {
        proxy_pass        http://backend;
        health_check      interval=5s fails=3 passes=2 uri=/health;
    }
}`,
  },
  "http-memcached": {
    title: "从 memcached 取响应",
    code: `location /cache/ {
    set        $memcached_key "$uri?$args";
    memcached_pass 127.0.0.1:11211;
    error_page 404 502 504 = @fallback;
}

location @fallback {
    proxy_pass http://backend;
}`,
  },
  "core": {
    title: "主配置骨架",
    code: `user  nginx;
worker_processes auto;
worker_rlimit_nofile 65535;

error_log /var/log/nginx/error.log warn;
pid       /run/nginx.pid;

events {
    worker_connections 8192;
    multi_accept on;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    tcp_nopush    on;
    keepalive_timeout 65;

    include /etc/nginx/conf.d/*.conf;
}`,
  },
  "stream-ssl-preread": {
    title: "按 SNI 分流（不终止 TLS）",
    code: `stream {
    map $ssl_preread_server_name $backend {
        a.example.com  app_a;
        b.example.com  app_b;
        default        app_default;
    }

    upstream app_a       { server 10.0.0.11:443; }
    upstream app_b       { server 10.0.0.12:443; }
    upstream app_default { server 10.0.0.13:443; }

    server {
        listen 443;
        ssl_preread on;
        proxy_pass  $backend;
    }
}`,
  },
  "stream-proxy": {
    title: "四层 TCP 代理",
    code: `stream {
    upstream db {
        server 10.0.0.21:5432;
        server 10.0.0.22:5432;
    }

    server {
        listen 5432;
        proxy_connect_timeout 5s;
        proxy_timeout       300s;
        proxy_pass          db;
    }
}`,
  },
  "stream-ssl": {
    title: "四层 TLS 终止",
    code: `stream {
    server {
        listen 443 ssl;
        ssl_certificate     example.com.crt;
        ssl_certificate_key example.com.key;
        ssl_protocols       TLSv1.2 TLSv1.3;
        proxy_pass          127.0.0.1:8080;
    }
}`,
  },
  "stream-limit-conn": {
    title: "四层连接数限制",
    code: `stream {
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    server {
        listen 12345;
        limit_conn addr 5;
        proxy_pass backend;
    }
}`,
  },
  "stream-return": {
    title: "直接返回并关闭",
    code: `stream {
    server {
        listen 12345;
        return "OK\\n";
    }
}`,
  },
  "stream-set": {
    title: "为变量赋值",
    code: `stream {
    server {
        listen 12345;
        set $upstream "10.0.0.31:9000";
        proxy_pass $upstream;
    }
}`,
  },
  "stream-log": {
    title: "四层会话日志",
    code: `stream {
    log_format basic '$remote_addr [$time_local] '
                     '$protocol $status $bytes_sent $bytes_received '
                     '$session_time';
    access_log /var/log/nginx/stream.log basic;
}`,
  },
  "stream-zone-sync": {
    title: "zone 集群同步",
    code: `stream {
    zone_sync;

    server {
        listen 10.0.0.1:7900;
        zone_sync_server 10.0.0.2:7900;
        zone_sync_server 10.0.0.3:7900;
    }
}`,
  },
  "mail-core": {
    title: "邮件代理骨架",
    code: `mail {
    server_name mail.example.com;
    auth_http   http://127.0.0.1:9000/auth;

    server {
        listen     143;
        protocol   imap;
        proxy_pass_error_message on;
    }

    server {
        listen     110;
        protocol   pop3;
    }

    server {
        listen     25;
        protocol   smtp;
    }
}`,
  },
  "mail-ssl": {
    title: "邮件服务 TLS",
    code: `mail {
    ssl_certificate     mail.example.com.crt;
    ssl_certificate_key mail.example.com.key;
    ssl_protocols       TLSv1.2 TLSv1.3;

    server {
        listen 993 ssl;
        protocol imap;
    }
}`,
  },
  "mail-auth-http": {
    title: "外部 HTTP 鉴权",
    code: `mail {
    auth_http          http://127.0.0.1:9000/auth;
    auth_http_header   X-Auth-Key "secret";
    auth_http_timeout  5s;
}`,
  },
  "mail-proxy": {
    title: "邮件代理参数",
    code: `mail {
    proxy_buffer     4k;
    proxy_timeout    300s;
    proxy_pass_error_message on;

    server {
        listen 25;
        protocol smtp;
    }
}`,
  },
};

// 官方页面提供了 Example Configuration 章节的模块
export const OFFICIAL_EXAMPLE_MODULES = new Set<string>(`core
http-access
http-addition
http-api
http-acme
google-perftools
http-auth-basic
http-auth-jwt
http-auth-request
http-auth-require
http-autoindex
http-browser
http-charset
http-dav
http-db
http-empty-gif
http-f4f
http-fastcgi
http-flv
http-geo
http-geoip
http-grpc
http-gunzip
http-gzip
http-gzip-static
http-headers
http-hls
http-image-filter
http-index
http-internal-redirect
http-js
http-json
http-keyval
http-limit-conn
http-limit-req
http-log
http-map
http-memcached
http-mirror
http-mp4
http-num-map
http-oidc
http-perl
http-proxy-protocol-vendor
http-proxy
http-random-index
http-realip
http-referer
http-scgi
http-session-log
http-slice
http-split-clients
http-ssi
http-ssl
http-status
http-stub-status
http-sub
http-tunnel
http-upstream-conf
http-upstream-hc
http-upstream
http-userid
http-uwsgi
http-v2
http-v3
http-xslt
mail-core
mail-realip
mail-ssl
mgmt
otel
stream-access
stream-core
stream-geo
stream-geoip
stream-js
stream-keyval
stream-limit-conn
stream-log
stream-map
stream-mqtt-filter
stream-mqtt-preread
stream-num-map
stream-pass
stream-proxy
stream-proxy-protocol-vendor
stream-realip
stream-return
stream-set
stream-split-clients
stream-ssl
stream-ssl-preread
stream-upstream-hc
stream-upstream
stream-zone-sync`.split("\n").filter(Boolean));
