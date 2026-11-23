import type { ReactNode } from "react";
import CopyAction from "./CopyAction";
import { IconTerminal } from "./Icons";

const NGINX_KEYWORDS = new Set([
  "http",
  "stream",
  "events",
  "server",
  "location",
  "upstream",
  "map",
  "split_clients",
  "listen",
  "zone",
  "keepalive",
  "least_conn",
  "ip_hash",
  "hash",
  "consistent",
  "weight",
  "max_fails",
  "fail_timeout",
  "slow_start",
  "backup",
  "down",
  "http2",
  "http3",
  "quic",
  "reuseport",
  "ssl",
  "proxy_pass",
  "proxy_http_version",
  "proxy_set_header",
  "proxy_connect_timeout",
  "proxy_next_upstream",
  "proxy_cache_path",
  "proxy_cache",
  "proxy_cache_key",
  "proxy_cache_valid",
  "proxy_cache_use_stale",
  "proxy_cache_lock",
  "proxy_cache_background_update",
  "limit_req_zone",
  "limit_conn_zone",
  "limit_req",
  "limit_req_status",
  "limit_conn",
  "limit_conn_status",
  "ssl_certificate",
  "ssl_certificate_key",
  "ssl_protocols",
  "ssl_session_cache",
  "ssl_session_timeout",
  "ssl_stapling",
  "ssl_stapling_verify",
  "ssl_preread",
  "add_header",
  "always",
  "default",
  "log_format",
  "access_log",
  "stub_status",
  "allow",
  "deny",
  "all",
  "worker_processes",
  "worker_rlimit_nofile",
  "worker_connections",
  "multi_accept",
  "use",
  "sendfile",
  "tcp_nopush",
  "keepalive_timeout",
  "return",
  "auto",
  "on",
  "off",
  "nginx",
  "sudo",
  "apt",
  "install",
  "systemctl",
  "enable",
  "curl",
  "kill",
  "cat",
]);

const TOKEN_RE =
  /(#.*$)|('[^']*'|"[^"]*")|(\$[a-zA-Z_][a-zA-Z0-9_]*|\$\([^)]+\))|(\b\d+(?:\.\d+)?(?:k|m|g|s|ms|d|h|r\/s)?\b)|(\b[a-zA-Z_][a-zA-Z0-9_]*\b)/gm;

export function renderCodeLine(line: string, lineIndex: number): ReactNode {
  const parts: ReactNode[] = [];
  let cursor = 0;
  TOKEN_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TOKEN_RE.exec(line)) !== null) {
    if (match.index > cursor) {
      parts.push(line.slice(cursor, match.index));
    }
    const [full, comment, str, variable, num, ident] = match;
    const key = `${lineIndex}-${match.index}`;
    if (comment) {
      parts.push(
        <span key={key} className="tok-cmt">
          {full}
        </span>
      );
    } else if (str) {
      parts.push(
        <span key={key} className="tok-str">
          {full}
        </span>
      );
    } else if (variable) {
      parts.push(
        <span key={key} className="tok-var">
          {full}
        </span>
      );
    } else if (num) {
      parts.push(
        <span key={key} className="tok-num">
          {full}
        </span>
      );
    } else if (ident && NGINX_KEYWORDS.has(ident)) {
      parts.push(
        <span key={key} className="tok-dir">
          {full}
        </span>
      );
    } else {
      parts.push(full);
    }
    cursor = match.index + full.length;
  }

  if (cursor < line.length) {
    parts.push(line.slice(cursor));
  }

  return parts.length > 0 ? parts : " ";
}

export default function NginxCode({
  code,
  title = "nginx.conf",
  copyLabel = "复制配置",
  highlightLines,
  className = "",
}: {
  code: string;
  title?: string;
  copyLabel?: string;
  highlightLines?: number[];
  className?: string;
}) {
  const lines = code.split("\n");
  const highlighted = highlightLines ? new Set(highlightLines) : null;

  return (
    <div className={`lp-code-box ${className}`}>
      <div className="lp-code-head">
        <span className="lp-code-title">
          <IconTerminal size={15} className="lp-code-icon" />
          <span>{title}</span>
        </span>
        <CopyAction text={code} label={copyLabel} />
      </div>
      <pre className="lp-code-pre" tabIndex={0}>
        <code className="lp-code-grid">
          {lines.map((line, i) => {
            const lineNum = i + 1;
            const isHighlighted = highlighted?.has(lineNum) ?? false;
            return (
              <span
                key={i}
                className="lp-code-row"
                data-highlighted={isHighlighted ? "true" : undefined}
              >
                <span className="lp-code-ln" aria-hidden="true">
                  {String(lineNum).padStart(2, "0")}
                </span>
                <span className="lp-code-text">
                  {renderCodeLine(line, i)}
                  {i < lines.length - 1 ? "\n" : ""}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
