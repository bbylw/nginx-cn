import { useState } from "react";

export default function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="codeblock">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ color: "#8aa79a", fontSize: 12 }}>{title ?? "code"}</span>
        <button className="copy-btn" onClick={copy}>
          {copied ? "已复制 ✓" : "复制"}
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
}
