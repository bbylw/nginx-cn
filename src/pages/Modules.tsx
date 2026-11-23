import { useId, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { MODULE_GROUPS, MODULES, MODULE_MAP, type ModuleGroup } from "../data/modules";
import { MODULE_EXAMPLES, OFFICIAL_EXAMPLE_MODULES } from "../data/module-examples";
import { useMedia } from "../hooks/useMedia";
import Breadcrumbs from "../components/Breadcrumbs";
import CodeBlock from "../components/CodeBlock";

function Badge({ children, tone = "n" }: { children: React.ReactNode; tone?: "n" | "g" | "y" }) {
  return <span className={`doc-badge is-${tone}`}>{children}</span>;
}

export function ModuleIndex() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<ModuleGroup | "all">("all");
  const narrow = useMedia("(max-width: 960px)");
  const searchId = useId();

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return MODULES.filter((m) => {
      if (group !== "all" && m.group !== group) return false;
      if (!needle) return true;
      return (
        m.name.toLowerCase().includes(needle) ||
        m.cn.toLowerCase().includes(needle) ||
        m.desc.toLowerCase().includes(needle) ||
        m.directives.some((d) => d.includes(needle))
      );
    });
  }, [q, group]);

  const grouped = MODULE_GROUPS.map((g) => ({
    ...g,
    items: list.filter((m) => m.group === g.key),
  })).filter((g) => g.items.length);

  const filterBar = (
    <>
      <h4>模块分组</h4>
      {(
        [{ key: "all" as const, cn: "全部模块" }, ...MODULE_GROUPS] as {
          key: ModuleGroup | "all";
          cn: string;
        }[]
      ).map((g) => {
        const n =
          g.key === "all"
            ? MODULES.length
            : MODULES.filter((m) => m.group === g.key).length;
        const active = group === g.key;
        return (
          <button
            key={g.key}
            type="button"
            onClick={() => setGroup(g.key)}
            aria-pressed={active}
            className={`docs-filter-btn ${active ? "is-active" : ""}`}
          >
            <span>{g.cn}</span>
            <span className="docs-filter-count">{n}</span>
          </button>
        );
      })}
      <div className="docs-side-note">
        目录与指令清单来自官方模块页面。
        <br />
        <a href="https://nginx.org/en/docs/dirindex.html" target="_blank" rel="noreferrer">
          官方指令索引
        </a>
      </div>
    </>
  );

  return (
    <div className="container docs-layout">
      <aside className="docs-side" aria-label="模块分组">
        {narrow ? (
          <details className="side-collapse">
            <summary>模块分组 · {MODULES.length} 个</summary>
            <div className="side-collapse-body">{filterBar}</div>
          </details>
        ) : (
          filterBar
        )}
      </aside>

      <article className="docs-content">
        <Breadcrumbs
          items={[
            { label: "文档", to: "/docs/overview" },
            { label: "模块参考" },
          ]}
        />
        <h1>模块参考</h1>
        <p className="docs-lead">
          官方共 {MODULES.length} 个模块。可按模块名、中文名、说明或指令名搜索——想找「哪个模块提供某条指令」时，直接搜指令即可。
        </p>

        <search>
          <label htmlFor={searchId} className="visually-hidden">
            搜索模块与指令
          </label>
          <input
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索模块或指令，例如 limit_req、ssl_preread、gzip…"
            className="docs-search-input docs-main-search"
          />
        </search>
        <div className="docs-search-meta" role="status" aria-live="polite">
          命中 {list.length} 个模块
        </div>

        {grouped.length === 0 && (
          <div className="callout note">没有匹配的模块，换个关键词试试。</div>
        )}

        {grouped.map((g) => (
          <section key={g.key} className="docs-mod-group">
            <h2>{g.cn}</h2>
            <p className="docs-mod-group-desc">{g.desc}</p>
            <div className="docs-mod-list">
              {g.items.map((m) => (
                <Link key={m.slug} to={`/docs/modules/${m.slug}`} className="docs-mod-card">
                  <div className="docs-mod-card-head">
                    <b>{m.cn}</b>
                    <code className="docs-mod-slug">{m.name}</code>
                    {m.since && <Badge>自 {m.since}</Badge>}
                    {m.optional && <Badge tone="y">需显式编译</Badge>}
                    <span className="docs-mod-count">{m.directives.length} 条指令</span>
                  </div>
                  <div className="docs-mod-desc">{m.desc}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}

export function ModulePage() {
  const { slug } = useParams();
  const narrow = useMedia("(max-width: 960px)");
  const m = slug ? MODULE_MAP.get(slug) : undefined;
  if (!m) return <Navigate to="/docs/modules" replace />;

  const groupMeta = MODULE_GROUPS.find((g) => g.key === m.group)!;
  const siblings = MODULES.filter((x) => x.group === m.group);
  const idx = siblings.findIndex((x) => x.slug === m.slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const siblingNav = (
    <>
      <h4>{groupMeta.cn}</h4>
      <div className="docs-siblings-list">
        {siblings.map((x) => (
          <Link
            key={x.slug}
            to={`/docs/modules/${x.slug}`}
            className={x.slug === m.slug ? "active" : ""}
            aria-current={x.slug === m.slug ? "page" : undefined}
          >
            <span>{x.cn}</span>
          </Link>
        ))}
      </div>
      <div className="docs-back-link">
        <Link to="/docs/modules">返回全部模块</Link>
      </div>
    </>
  );

  const codeTitle =
    m.group === "stream"
      ? "stream 上下文"
      : m.group === "mail"
        ? "mail 上下文"
        : "nginx.conf";

  return (
    <div className="container docs-layout">
      <aside className="docs-side" aria-label="同组模块">
        {narrow ? (
          <details className="side-collapse">
            <summary>
              {groupMeta.cn} · {siblings.length} 个模块
            </summary>
            <div className="side-collapse-body">{siblingNav}</div>
          </details>
        ) : (
          siblingNav
        )}
      </aside>

      <article className="docs-content">
        <Breadcrumbs
          items={[
            { label: "文档", to: "/docs/overview" },
            { label: "模块参考", to: "/docs/modules" },
            { label: m.cn },
          ]}
        />
        <h1 className="docs-mod-title">{m.cn}</h1>
        <div className="docs-mod-meta">
          <code className="docs-mod-code">{m.name}</code>
          {m.since && <Badge>自 {m.since}</Badge>}
          {m.optional ? (
            <Badge tone="y">默认不编译，需显式开启</Badge>
          ) : (
            <Badge tone="g">默认包含</Badge>
          )}
        </div>
        <p className="docs-mod-summary">{m.desc}</p>

        <div className="callout info">
          <b>官方页面</b>
          <a href={m.url} target="_blank" rel="noreferrer">
            {m.url.replace("https://", "")}
          </a>
          —— 指令的完整参数、默认值、可出现的上下文（http / server / location 等）都在那里。
        </div>

        <h2>指令清单（{m.directives.length}）</h2>
        {m.optional && (
          <div className="callout warn">
            <b>编译提示</b>
            该模块需要对 --with-* 参数显式开启，或来自商业订阅。用 <code>nginx -V</code> 确认当前二进制是否已包含。
          </div>
        )}
        {m.directives.length === 0 ? (
          <div className="callout note">
            <b>该模块不提供指令</b>
            它只提供内嵌变量（embedded variables），完整参数与变量列表见
            <a href={m.url} target="_blank" rel="noreferrer">
              {" "}
              官方页面
            </a>
            。
          </div>
        ) : (
          <div className="docs-dir-grid">
            {m.directives.map((d) => (
              <a
                key={d}
                href={`${m.url}#${d}`}
                target="_blank"
                rel="noreferrer"
                className="docs-dir-chip"
              >
                {d}
              </a>
            ))}
          </div>
        )}

        <h2>最小示例</h2>
        {MODULE_EXAMPLES[m.slug] ? (
          <>
            <p className="docs-example-title">{MODULE_EXAMPLES[m.slug].title}</p>
            <CodeBlock code={MODULE_EXAMPLES[m.slug].code} title={codeTitle} />
          </>
        ) : (
          <div className="callout note">
            <b>未收录手写示例</b>
            该模块的完整示例配置请直接看官方页面
            {OFFICIAL_EXAMPLE_MODULES.has(m.slug) ? (
              <>
                {" "}
                的{" "}
                <a href={`${m.url}#example`} target="_blank" rel="noreferrer">
                  Example Configuration
                </a>
              </>
            ) : (
              <a href={m.url} target="_blank" rel="noreferrer">
                官方页面
              </a>
            )}
            。
          </div>
        )}
        {MODULE_EXAMPLES[m.slug] && OFFICIAL_EXAMPLE_MODULES.has(m.slug) && (
          <p className="docs-example-more">
            更多参数组合见官方
            <a href={`${m.url}#example`} target="_blank" rel="noreferrer">
              {" "}
              Example Configuration
            </a>
          </p>
        )}

        <nav className="docs-pager" aria-label="模块切换">
          {prev ? (
            <Link to={`/docs/modules/${prev.slug}`} className="feature-card docs-pager-link">
              <span className="docs-pager-label">上一个模块</span>
              <b>{prev.cn}</b>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              to={`/docs/modules/${next.slug}`}
              className="feature-card docs-pager-link is-next"
            >
              <span className="docs-pager-label">下一个模块</span>
              <b>{next.cn}</b>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </article>
    </div>
  );
}
