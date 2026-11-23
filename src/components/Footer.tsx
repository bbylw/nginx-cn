import { Link } from "react-router-dom";

const SITE_PATHS = [
  { label: "文档目录", to: "/docs/overview" },
  { label: "全部模块", to: "/docs/modules" },
];

const EXTERNAL_RESOURCES = [
  { label: "官方文档", href: "https://nginx.org/en/docs/" },
  { label: "GitHub 源码", href: "https://github.com/nginx/nginx" },
  { label: "下载页", href: "https://nginx.org/en/download.html" },
  { label: "社区博客", href: "https://blog.nginx.org/" },
];

export default function Footer() {
  return (
    <footer className="footer lp-deferred">
      <div className="footer-inner">
        <div className="footer-top">
          <Link to="/" className="footer-brand" aria-label="NGINX 首页">
            <img
              src="/nginx-mark.svg"
              alt=""
              width={28}
              height={28}
              loading="lazy"
              decoding="async"
            />
            <div className="footer-brand-copy">
              <strong>NGINX</strong>
              <span>高性能 Web 服务器与反向代理</span>
            </div>
          </Link>

          <nav className="footer-links" aria-label="站点与官方资源">
            {SITE_PATHS.map((item) => (
              <Link key={item.to} to={item.to} className="footer-link">
                {item.label}
              </Link>
            ))}
            {EXTERNAL_RESOURCES.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="footer-link"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="footer-bottom">
          <div className="footer-legal">
            <a
              href="https://nginx.org/LICENSE"
              target="_blank"
              rel="noreferrer"
              className="footer-legal-link"
            >
              BSD 二条款许可
            </a>
            <Link to="/legal" className="footer-legal-link">
              隐私与站点说明
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
