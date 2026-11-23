import { Link } from "react-router-dom";
import { IconCompass } from "../components/Icons";
import NginxCode from "../components/NginxCode";

const NOT_FOUND_SNIPPET = `server {
    listen 80 default_server;
    location / {
        return 404;
    }
}`;

export default function NotFound() {
  return (
    <section className="lp-utility-page">
      <div className="lp-wrap">
        <div className="lp-utility-card">
          <div className="lp-utility-head">
            <span className="lp-utility-icon">
              <IconCompass size={24} />
            </span>
            <span className="lp-utility-code">HTTP 404</span>
          </div>

          <h1 className="lp-h1-utility">这个路径没有匹配到对应页面</h1>
          <p className="lp-utility-desc">
            你访问的地址可能已移动、拼写有误，或尚未在当前站点的路由表中注册。
          </p>

          <NginxCode code={NOT_FOUND_SNIPPET} title="nginx.conf · 路由未命中" copyLabel="复制配置" />

          <div className="lp-utility-actions">
            <Link to="/" className="lp-btn-main">
              返回首页
            </Link>
            <Link to="/docs/overview" className="lp-link-tertiary">
              浏览中文文档
            </Link>
            <Link to="/docs/modules" className="lp-link-tertiary">
              查看全部模块
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
