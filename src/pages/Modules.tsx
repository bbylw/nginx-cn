import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { MODULE_GROUPS, MODULES, MODULE_MAP, type ModuleGroup } from "../data/modules";
import { MODULE_EXAMPLES, OFFICIAL_EXAMPLE_MODULES } from "../data/module-examples";
import { useMedia } from "../hooks/useMedia";

function Badge({ children, tone = "n" }: { children: React.ReactNode; tone?: "n" | "g" | "y" }) {
  const bg = tone === "g" ? "#e9faf3" : tone === "y" ? "#fef6e8" : "var(--bg-soft)";
  const bd = tone === "g" ? "#a8ecca" : tone === "y" ? "#f5d9a8" : "var(--line)";
  return (
    <span style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 999, padding: "2px 8px", fontSize: 11.5, fontWeight: 700, color: "#2c3a33" }}>
      {children}
    </span>
  );
}

export function ModuleIndex() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<ModuleGroup | "all">("all");
  const narrow = useMedia("(max-width: 960px)");

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

  const grouped = MODULE_GROUPS.map((g) => ({ ...g, items: list.filter((m) => m.group === g.key) })).filter((g) => g.items.length);

  const filterBar = (
    <>
      <h4>模块分组</h4>
      {([{ key: "all" as const, cn: "全部模块" }, ...MODULE_GROUPS] as { key: ModuleGroup | "all"; cn: string }[]).map((g) => {
        const n = g.key === "all" ? MODULES.length : MODULES.filter((m) => m.group === g.key).length;
        const active = group === g.key;
        return (
          <button
            key={g.key}
            onClick={() => setGroup(g.key)}
            aria-pressed={active}
            style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "9px 10px", borderRadius: 10, border: 0, background: active ? "var(--ink)" : "transparent", color: active ? "white" : "#21322a", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
          >
            {g.cn} <span style={{ opacity: 0.6 }}>{n}</span>
          </button>
        );
      })}
      <div style={{ marginTop: 12, padding: 12, background: "var(--bg-soft)", borderRadius: 12, fontSize: 13, color: "var(--muted)" }}>
        目录与指令清单来自官方模块页面。
        <br />
        <a href="https://nginx.org/en/docs/dirindex.html" target="_blank" rel="noreferrer">官方指令索引</a>
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
        <div className="crumb">文档 / 模块参考</div>
        <h1>模块参考</h1>
        <p style={{ color: "var(--muted)", fontSize: 16 }}>
          官方共 {MODULES.length} 个模块。可按模块名、中文名、说明或指令名搜索——想找「哪个模块提供某条指令」时，直接搜指令即可。
        </p>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索模块或指令，例如 limit_req、ssl_preread、gzip…"
          aria-label="搜索模块与指令"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", fontSize: 15, margin: "14px 0 6px", outline: "none" }}
        />
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>命中 {list.length} 个模块</div>

        {grouped.length === 0 && <div className="callout note">没有匹配的模块，换个关键词试试。</div>}

        {grouped.map((g) => (
          <section key={g.key} style={{ marginTop: 22 }}>
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>{g.cn}</h2>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 0 }}>{g.desc}</p>
            <div style={{ display: "grid", gap: 8 }}>
              {g.items.map((m) => (
                <Link
                  key={m.slug}
                  to={`/docs/modules/${m.slug}`}
                  style={{ display: "block", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px", color: "inherit", background: "white" }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <b style={{ fontSize: 15 }}>{m.cn}</b>
                    <code style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{m.name}</code>
                    {m.since && <Badge>自 {m.since}</Badge>}
                    {m.optional && <Badge tone="y">需显式编译</Badge>}
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>{m.directives.length} 条指令</span>
                  </div>
                  <div style={{ fontSize: 14, color: "#43524b", marginTop: 4, lineHeight: 1.6 }}>{m.desc}</div>
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
      <div style={{ maxHeight: "62vh", overflow: "auto" }}>
        {siblings.map((x) => (
          <Link key={x.slug} to={`/docs/modules/${x.slug}`} className={x.slug === m.slug ? "active" : ""}>
            <span style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 8 }}>
              <span>{x.cn}</span>
            </span>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <Link to="/docs/modules" style={{ fontSize: 13 }}>返回全部模块</Link>
      </div>
    </>
  );

  return (
    <div className="container docs-layout">
      <aside className="docs-side" aria-label="同组模块">
        {narrow ? (
          <details className="side-collapse">
            <summary>{groupMeta.cn} · {siblings.length} 个模块</summary>
            <div className="side-collapse-body">{siblingNav}</div>
          </details>
        ) : (
          siblingNav
        )}
      </aside>

      <article className="docs-content">
        <div className="crumb">
          文档 / 模块参考 / {groupMeta.cn} / <span style={{ color: "var(--ink)", fontWeight: 700 }}>{m.cn}</span>
        </div>
        <h1 style={{ marginBottom: 6 }}>{m.cn}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: 8, padding: "3px 8px" }}>{m.name}</code>
          {m.since && <Badge>自 {m.since}</Badge>}
          {m.optional ? <Badge tone="y">默认不编译，需显式开启</Badge> : <Badge tone="g">默认包含</Badge>}
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.8 }}>{m.desc}</p>

        <div className="callout info">
          <b>官方页面</b>
          <a href={m.url} target="_blank" rel="noreferrer">{m.url.replace("https://", "")}</a>
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
            <a href={m.url} target="_blank" rel="noreferrer"> 官方页面</a>。
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {m.directives.map((d) => (
              <a
                key={d}
                href={`${m.url}#${d}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontFamily: "var(--font-mono)", fontSize: 13, border: "1px solid var(--line)", borderRadius: 8, padding: "5px 9px", background: "white", color: "#1a2420" }}
              >
                {d}
              </a>
            ))}
          </div>
        )}

        <h2>最小示例</h2>
        {MODULE_EXAMPLES[m.slug] ? (
          <>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 0 }}>{MODULE_EXAMPLES[m.slug].title}</p>
            <div className="codeblock">
              <div style={{ color: "#8aa79a", fontSize: 12, marginBottom: 8 }}>
                {m.group === "stream" ? "stream 上下文" : m.group === "mail" ? "mail 上下文" : "nginx.conf"}
              </div>
              <pre>{MODULE_EXAMPLES[m.slug].code}</pre>
            </div>
          </>
        ) : (
          <div className="callout note">
            <b>未收录手写示例</b>
            该模块的完整示例配置请直接看官方页面
            {OFFICIAL_EXAMPLE_MODULES.has(m.slug) ? (
              <> 的 <a href={`${m.url}#example`} target="_blank" rel="noreferrer">Example Configuration</a></>
            ) : (
              <a href={m.url} target="_blank" rel="noreferrer">官方页面</a>
            )}
            。
          </div>
        )}
        {MODULE_EXAMPLES[m.slug] && OFFICIAL_EXAMPLE_MODULES.has(m.slug) && (
          <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
            更多参数组合见官方
            <a href={`${m.url}#example`} target="_blank" rel="noreferrer"> Example Configuration</a>
          </p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 28 }}>
          {prev ? (
            <Link to={`/docs/modules/${prev.slug}`} className="feature-card" style={{ color: "inherit" }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>上一个模块</div>
              <b>{prev.cn}</b>
            </Link>
          ) : <div />}
          {next ? (
            <Link to={`/docs/modules/${next.slug}`} className="feature-card" style={{ color: "inherit", textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>下一个模块</div>
              <b>{next.cn}</b>
            </Link>
          ) : <div />}
        </div>
      </article>
    </div>
  );
}


