import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { IconX } from "./Icons";

export default function Navbar() {
  const { pathname } = useLocation();
  const isDocsRoute = pathname.startsWith("/docs");
  const isHomeActive = pathname === "/";
  const isModulesActive = pathname.startsWith("/docs/modules");
  const isDocsActive = pathname.startsWith("/docs") && !isModulesActive;

  const [open, setOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeImmediately = useCallback(() => {
    clearCloseTimer();
    setDrawerVisible(false);
    setOpen(false);
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [clearCloseTimer]);

  const closeDrawer = useCallback(() => {
    clearCloseTimer();
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      closeImmediately();
      return;
    }
    setDrawerVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      closeImmediately();
    }, 300);
  }, [clearCloseTimer, closeImmediately]);

  const openDrawer = useCallback(() => {
    clearCloseTimer();
    const dialog = dialogRef.current;
    if (!dialog) return;
    setOpen(true);
    if (!dialog.open) {
      dialog.showModal();
    }
    window.requestAnimationFrame(() => {
      setDrawerVisible(true);
    });
  }, [clearCloseTimer]);

  useEffect(() => {
    closeImmediately();
  }, [pathname, closeImmediately]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const mobileLinks = [
    { to: "/", label: "首页", active: isHomeActive, external: false },
    { to: "/docs/overview", label: "文档", active: isDocsActive, external: false },
    { to: "/docs/modules", label: "模块", active: isModulesActive, external: false },
    {
      to: "https://github.com/nginx/nginx",
      label: "GitHub 源码",
      active: false,
      external: true,
    },
    { to: "/docs/install", label: "安装指南", active: pathname === "/docs/install", external: false },
  ];

  return (
    <header className="nav-shell" data-surface={isDocsRoute ? "light" : "dark"}>
      <a href="#main-content" className="skip-link">
        跳至正文
      </a>

      <div className="nav-pill">
        <Link to="/" className="nav-brand" aria-label="NGINX 中文官网首页">
          <img
            className="nav-brand-mark"
            src="/nginx-mark.svg"
            alt=""
            width={32}
            height={32}
          />
          <span className="nav-brand-name">NGINX</span>
        </Link>

        <nav className="nav-links" aria-label="主导航">
          <Link
            to="/"
            className={`nav-link ${isHomeActive ? "is-active" : ""}`}
            aria-current={isHomeActive ? "page" : undefined}
          >
            首页
          </Link>
          <Link
            to="/docs/overview"
            className={`nav-link ${isDocsActive ? "is-active" : ""}`}
            aria-current={isDocsActive ? "page" : undefined}
          >
            文档
          </Link>
          <Link
            to="/docs/modules"
            className={`nav-link ${isModulesActive ? "is-active" : ""}`}
            aria-current={isModulesActive ? "page" : undefined}
          >
            模块
          </Link>
          <a
            className="nav-link nav-hide-md"
            href="https://github.com/nginx/nginx"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>

        <div className="nav-actions">
          <Link
            to="/docs/install"
            className="nav-cta"
            aria-current={pathname === "/docs/install" ? "page" : undefined}
          >
            安装指南
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            aria-label={open ? "关闭导航菜单" : "打开导航菜单"}
            data-open={open ? "true" : "false"}
            onClick={() => (open ? closeDrawer() : openDrawer())}
          >
            <span className="nav-toggle-lines" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        id="mobile-nav-drawer"
        className="mobile-drawer"
        aria-label="站点导航"
        data-visible={drawerVisible ? "true" : "false"}
        onCancel={(e) => {
          e.preventDefault();
          closeDrawer();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            closeDrawer();
          }
        }}
      >
        <div className="mobile-drawer-panel">
          <div className="mobile-drawer-top">
            <Link to="/" className="nav-brand" onClick={closeImmediately}>
              <img
                className="nav-brand-mark"
                src="/nginx-mark.svg"
                alt=""
                width={32}
                height={32}
              />
              <span className="nav-brand-name">NGINX 中文官网</span>
            </Link>
            <button
              type="button"
              className="mobile-drawer-close"
              aria-label="关闭导航菜单"
              autoFocus
              onClick={closeDrawer}
            >
              <IconX size={20} />
            </button>
          </div>

          <nav className="mobile-drawer-nav" aria-label="移动端主导航">
            {mobileLinks.map((item, index) => {
              const style = { "--stagger-index": index } as React.CSSProperties;
              if (item.external) {
                return (
                  <a
                    key={item.label}
                    href={item.to}
                    target="_blank"
                    rel="noreferrer"
                    className="mobile-drawer-link"
                    style={style}
                  >
                    <span>{item.label}</span>
                  </a>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`mobile-drawer-link ${item.active ? "is-active" : ""}`}
                  aria-current={item.active ? "page" : undefined}
                  style={style}
                  onClick={closeImmediately}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mobile-drawer-foot">
            <Link to="/legal" className="mobile-drawer-meta" onClick={closeImmediately}>
              隐私与开源声明
            </Link>
            <span className="mobile-drawer-meta">BSD 二条款开源许可</span>
          </div>
        </div>
      </dialog>
    </header>
  );
}
