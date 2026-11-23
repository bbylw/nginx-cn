import { Link } from "react-router-dom";

const RESOURCES = [
  { label: "官方文档", href: "https://nginx.org/en/docs/" },
  { label: "GitHub 源码", href: "https://github.com/nginx/nginx" },
  { label: "下载页", href: "https://nginx.org/en/download.html" },
  { label: "社区博客", href: "https://blog.nginx.org/" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link to="/" className="footer-mark" aria-label="NGINX 中文官网首页">
          <img src="/nginx-mark.svg" alt="" width={28} height={28} />
        </Link>
        <nav className="footer-links" aria-label="资源">
          {RESOURCES.map((r) => (
            <a key={r.label} href={r.href} target="_blank" rel="noreferrer" className="footer-link">
              {r.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
