import { NavLink, Link, useNavigate } from "react-router-dom";
import { Button } from "@nimbus-ds/components";

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand" aria-label="NGINX 中文官网首页">
          <span className="brand-mark" aria-hidden>N</span>
        </Link>
        <nav className="nav-links" aria-label="主导航">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            首页
          </NavLink>
          <NavLink to="/docs/overview" className={({ isActive }) => (isActive ? "active" : "")}>
            文档
          </NavLink>
          <NavLink to="/docs/modules" className={({ isActive }) => (isActive ? "active" : "")}>
            模块
          </NavLink>
          <a className="hide-md" href="https://github.com/nginx/nginx" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <Button appearance="primary" className="btn-primary" onClick={() => navigate("/docs/install")}>
            快速开始 »
          </Button>
        </nav>
      </div>
    </header>
  );
}
