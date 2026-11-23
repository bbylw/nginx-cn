import { useMemo, useState } from "react";
import { Link, NavLink, useParams, Navigate } from "react-router-dom";
import { DOCS, GROUPS, type DocSection } from "../data/handbook";
import { MODULES } from "../data/modules";
import { useMedia } from "../hooks/useMedia";
import CodeBlock from "../components/CodeBlock";

function Block({ block }: { block: DocSection["blocks"][number] }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "h2":
      return <h2>{block.text}</h2>;
    case "h3":
      return <h3>{block.text}</h3>;
    case "ul":
      return (
        <ul>
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ol>
      );
    case "code":
      return <CodeBlock code={block.code} title={block.title ?? block.lang} />;
    case "callout":
      return (
        <div className={`callout ${block.tone}`}>
          <b>{block.title}</b>
          {block.text}
        </div>
      );
    case "table":
      return (
        <table className="doc-table">
          <thead>
            <tr>{block.headers.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      );
  }
}

export default function Docs() {
  const { slug } = useParams();
  const [q, setQ] = useState("");
  const narrow = useMedia("(max-width: 960px)");

  const active = useMemo(() => DOCS.find((d) => d.slug === slug), [slug]);
  const filtered = useMemo(() => {
    const needle = q.trim();
    if (!needle) return DOCS;
    return DOCS.filter((d) => (d.title + d.desc + d.group).includes(needle));
  }, [q]);

  if (!slug || !active) return <Navigate to="/docs/overview" replace />;

  const idx = DOCS.findIndex((d) => d.slug === active.slug);
  const prev = idx > 0 ? DOCS[idx - 1] : null;
  const next = idx < DOCS.length - 1 ? DOCS[idx + 1] : null;

  return (
    <div className="container docs-layout">
      <aside className="docs-side" aria-label="文档侧边栏">
        <SidebarInner q={q} setQ={setQ} filtered={filtered} narrow={narrow} />
      </aside>

      <article className="docs-content">
        <div className="crumb">
          文档 / {active.group} / <span style={{ color: "var(--ink)", fontWeight: 700 }}>{active.title}</span>
        </div>
        <h1>{active.title}</h1>
        <p style={{ color: "var(--muted)", fontSize: 16 }}>
          {active.desc}
          {active.source && (
            <>
              {" · "}
              <a href={`https://${active.source}`} target="_blank" rel="noreferrer">原文</a>
            </>
          )}
        </p>
        {active.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 32 }}>
          {prev ? (
            <Link to={`/docs/${prev.slug}`} className="feature-card" style={{ color: "inherit" }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>上一章</div>
              <b>{prev.title}</b>
            </Link>
          ) : <div />}
          {next ? (
            <Link to={`/docs/${next.slug}`} className="feature-card" style={{ color: "inherit", textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>下一章</div>
              <b>{next.title}</b>
            </Link>
          ) : <div />}
        </div>
      </article>
    </div>
  );
}

function SidebarInner({
  q,
  setQ,
  filtered,
  narrow,
}: {
  q: string;
  setQ: (v: string) => void;
  filtered: DocSection[];
  narrow: boolean;
}) {
  const body = (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索章节…"
        aria-label="搜索文档章节"
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 14, marginBottom: 10, outline: "none" }}
      />
      {GROUPS.map((g) => {
        if (g === "模块参考") {
          return (
            <div key={g}>
              <h4>{g}</h4>
              <NavLink to="/docs/modules" className={() => ""}>
                <span style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  全部官方模块
                  <span>{MODULES.length}</span>
                </span>
              </NavLink>
            </div>
          );
        }
        const items = filtered.filter((d) => d.group === g);
        if (!items.length) return null;
        return (
          <div key={g}>
            <h4>{g}</h4>
            {items.map((d) => (
              <NavLink key={d.slug} to={`/docs/${d.slug}`} className={({ isActive }) => (isActive ? "active" : "")}>
                {d.title}
              </NavLink>
            ))}
          </div>
        );
      })}
      <div style={{ marginTop: 12, padding: 12, background: "var(--bg-soft)", borderRadius: 12, fontSize: 13, color: "var(--muted)" }}>
        完整目录对照：
        <br />
        <a href="https://nginx.org/en/docs/index.html" target="_blank" rel="noreferrer">nginx.org/en/docs</a>
      </div>
    </>
  );

  if (!narrow) return body;
  return (
    <details className="side-collapse">
      <summary>文档目录 · {DOCS.length} 章</summary>
      <div className="side-collapse-body">{body}</div>
    </details>
  );
}
