import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { IconArrowUpRight, IconGithub, IconX } from "./Icons";
import { MODULE_COUNT } from "../data/site-stats";

const HOME_ANCHORS = [
  { id: "capabilities", label: "能力" },
  { id: "architecture", label: "架构" },
  { id: "scenarios", label: "场景" },
  { id: "reload", label: "运维" },
  { id: "faq", label: "问答" },
] as const;

let supportsDisplayTransition: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (
    typeof window === "undefined" ||
    !window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = "none";
  supportsDisplayTransition = getComputedStyle(probe).display === "block";
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      window.CSS?.supports?.("overlay", "auto") &&
      canTransitionDisplay()
  );
}

async function closeTopLayer(dialog: HTMLDialogElement) {
  if (!dialog.open) return;
  if (!supportsTopLayerExit()) {
    dialog.setAttribute("data-closing", "");
    const animations = dialog.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((resolve) => window.setTimeout(resolve, 2000)),
      ]);
    }
    if (!dialog.hasAttribute("data-closing")) return;
    dialog.removeAttribute("data-closing");
  }
  if (dialog.open) {
    dialog.close();
  }
}

export default function Navbar() {
  const { pathname } = useLocation();
  const isDocsRoute = pathname.startsWith("/docs");
  const isHomeActive = pathname === "/";
  const isInstallActive = pathname === "/docs/install";
  const isModulesActive = pathname.startsWith("/docs/modules");
  const isDocsActive = pathname.startsWith("/docs") && !isModulesActive && !isInstallActive;
  const surface = isDocsRoute ? "light" : "dark";

  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const anchorsRef = useRef<HTMLUListElement | null>(null);

  const closeImmediately = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.removeAttribute("data-closing");
      if (dialog.open) {
        dialog.close();
      }
    }
    setOpen(false);
  }, []);

  const closeDrawer = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open) {
      setOpen(false);
      return;
    }
    await closeTopLayer(dialog);
    setOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.removeAttribute("data-closing");
    setOpen(true);
    if (!dialog.open) {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    closeImmediately();
  }, [pathname, closeImmediately]);

  useEffect(() => {
    if (!isHomeActive) return;
    const list = anchorsRef.current;
    if (!list) return;
    const anchorLinks = Array.from(
      list.querySelectorAll<HTMLAnchorElement>(".nav-anchor")
    );
    if (anchorLinks.length === 0) return;

    if (typeof CSS !== "undefined" && CSS.supports("scroll-target-group", "auto")) {
      const syncAriaCurrent = () => {
        const current = list.querySelector<HTMLAnchorElement>(".nav-anchor:target-current");
        for (const link of anchorLinks) {
          if (link === current) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        }
      };
      syncAriaCurrent();
      document.addEventListener("scrollend", syncAriaCurrent, { passive: true });
      return () => {
        document.removeEventListener("scrollend", syncAriaCurrent);
      };
    }

    const targets = HOME_ANCHORS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute("id");
          for (const link of anchorLinks) {
            const active = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("target-current", active);
            if (active) {
              link.setAttribute("aria-current", "true");
            } else {
              link.removeAttribute("aria-current");
            }
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    targets.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHomeActive]);

  const mobileLinks = [
    {
      to: "/",
      label: "首页",
      desc: "核心能力与事件驱动架构",
      active: isHomeActive,
      external: false,
    },
    {
      to: "/docs/overview",
      label: "文档",
      desc: "配置语法、运维与排查手册",
      active: isDocsActive,
      external: false,
    },
    {
      to: "/docs/modules",
      label: "模块",
      desc: `${MODULE_COUNT} 个官方模块与指令清单`,
      active: isModulesActive,
      external: false,
    },
    {
      to: "/docs/install",
      label: "安装指南",
      desc: "官方包仓库与源码编译路径",
      active: isInstallActive,
      external: false,
    },
    {
      to: "https://github.com/nginx/nginx",
      label: "GitHub 源码",
      desc: "nginx/nginx 开源仓库",
      active: false,
      external: true,
    },
  ];

  return (
    <header className="nav-shell" data-surface={surface}>
      <a href="#main-content" className="skip-link">
        跳至正文
      </a>

      <div className="nav-pill">
        <Link
          to="/"
          className="nav-brand"
          aria-label="NGINX 首页"
          onClick={(e) => {
            if (isHomeActive && window.scrollY > 0) {
              e.preventDefault();
              window.scrollTo({ top: 0 });
            }
          }}
        >
          <img
            className="nav-brand-mark"
            src="/nginx-mark.svg"
            alt=""
            width={28}
            height={28}
          />
          <span className="nav-brand-name">NGINX</span>
        </Link>

        <span className="nav-sep" aria-hidden="true" />

        <nav className="nav-links" aria-label="主导航">
          {isHomeActive ? (
            <>
              <ul ref={anchorsRef} className="nav-list nav-anchors" role="list">
                {HOME_ANCHORS.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="nav-link nav-anchor">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>

              <span className="nav-sep nav-sep-inner" aria-hidden="true" />

              <ul className="nav-list nav-routes" role="list">
                <li>
                  <Link
                    to="/docs/overview"
                    className={`nav-link ${isDocsActive ? "is-active" : ""}`}
                    aria-current={isDocsActive ? "page" : undefined}
                  >
                    文档
                  </Link>
                </li>
                <li>
                  <Link
                    to="/docs/modules"
                    className={`nav-link ${isModulesActive ? "is-active" : ""}`}
                    aria-current={isModulesActive ? "page" : undefined}
                  >
                    模块
                  </Link>
                </li>
              </ul>
            </>
          ) : (
            <ul className="nav-list nav-routes" role="list">
              <li>
                <Link
                  to="/"
                  className={`nav-link ${isHomeActive ? "is-active" : ""}`}
                  aria-current={isHomeActive ? "page" : undefined}
                >
                  首页
                </Link>
              </li>
              <li>
                <Link
                  to="/docs/overview"
                  className={`nav-link ${isDocsActive ? "is-active" : ""}`}
                  aria-current={isDocsActive ? "page" : undefined}
                >
                  文档
                </Link>
              </li>
              <li>
                <Link
                  to="/docs/modules"
                  className={`nav-link ${isModulesActive ? "is-active" : ""}`}
                  aria-current={isModulesActive ? "page" : undefined}
                >
                  模块
                </Link>
              </li>
            </ul>
          )}
        </nav>

        <span className="nav-sep nav-sep-actions" aria-hidden="true" />

        <div className="nav-actions">
          <a
            className="nav-icon-btn"
            href="https://github.com/nginx/nginx"
            target="_blank"
            rel="noreferrer"
            aria-label="访问 NGINX GitHub 源码仓库（新窗口打开）"
            title="GitHub 源码"
          >
            <IconGithub size={18} />
          </a>

          <Link
            to="/docs/install"
            className={`nav-cta ${isInstallActive ? "is-current" : ""}`}
            aria-current={isInstallActive ? "page" : undefined}
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
            onClick={() => (open ? void closeDrawer() : openDrawer())}
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
        data-surface={surface}
        aria-label="站点导航"
        onClose={() => {
          dialogRef.current?.removeAttribute("data-closing");
          setOpen(false);
        }}
        onCancel={(e) => {
          if (e.cancelable) {
            e.preventDefault();
            void closeDrawer();
          }
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            void closeDrawer();
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
                width={28}
                height={28}
              />
              <span className="nav-brand-name">NGINX</span>
            </Link>
            <button
              type="button"
              className="mobile-drawer-close"
              aria-label="关闭导航菜单"
              autoFocus
              onClick={() => void closeDrawer()}
            >
              <IconX size={20} />
            </button>
          </div>

          <nav className="mobile-drawer-nav" aria-label="移动端主导航">
            {isHomeActive && (
              <div className="mobile-drawer-anchors">
                <span className="mobile-drawer-section-title">本页锚点</span>
                <ul className="mobile-drawer-anchor-list" role="list">
                  {HOME_ANCHORS.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="mobile-drawer-anchor"
                        onClick={closeImmediately}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ul className="mobile-drawer-list" role="list">
              {mobileLinks.map((item, index) => {
                const style = { "--stagger-index": index } as React.CSSProperties;
                if (item.external) {
                  return (
                    <li key={item.label}>
                      <a
                        href={item.to}
                        target="_blank"
                        rel="noreferrer"
                        className="mobile-drawer-link"
                        style={style}
                      >
                        <span className="mobile-drawer-copy">
                          <span className="mobile-drawer-label">{item.label}</span>
                          <span className="mobile-drawer-desc">{item.desc}</span>
                        </span>
                        <span className="mobile-drawer-icons" aria-hidden="true">
                          <IconGithub size={18} className="mobile-drawer-ext" />
                          <IconArrowUpRight size={16} className="mobile-drawer-ext" />
                        </span>
                        <span className="visually-hidden">（新窗口打开）</span>
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className={`mobile-drawer-link ${item.active ? "is-active" : ""}`}
                      aria-current={item.active ? "page" : undefined}
                      style={style}
                      onClick={closeImmediately}
                    >
                      <span className="mobile-drawer-copy">
                        <span className="mobile-drawer-label">{item.label}</span>
                        <span className="mobile-drawer-desc">{item.desc}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
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
