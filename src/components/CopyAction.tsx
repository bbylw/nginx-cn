import { useEffect, useRef, useState } from "react";
import { IconCheck, IconCopy } from "./Icons";

let lastAnnouncement = "";

export default function CopyAction({
  text,
  label = "复制配置",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [outcome, setOutcome] = useState<"idle" | "copied" | "failed">("idle");
  const [statusText, setStatusText] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function report(ok: boolean) {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    let message = ok ? "已复制" : "复制失败";
    if (message === lastAnnouncement) {
      message += "\u00A0";
    }
    lastAnnouncement = message;

    setOutcome(ok ? "copied" : "failed");
    setStatusText("");
    window.requestAnimationFrame(() => {
      setStatusText(message);
    });

    timerRef.current = window.setTimeout(() => {
      setOutcome("idle");
      setStatusText("");
      timerRef.current = null;
    }, 2000);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      report(true);
    } catch {
      report(false);
    }
  }

  return (
    <span className={`lp-copy-wrap ${className}`}>
      <button
        type="button"
        className="lp-copy-btn"
        data-copied={outcome === "copied" ? "" : undefined}
        data-failed={outcome === "failed" ? "" : undefined}
        onClick={handleCopy}
      >
        {outcome === "copied" ? <IconCheck size={14} /> : <IconCopy size={14} />}
        <span>{outcome === "copied" ? "已复制" : outcome === "failed" ? "复制失败" : label}</span>
      </button>
      <span className="lp-copy-status visually-hidden" role="status" aria-live="polite">
        {statusText}
      </span>
    </span>
  );
}
