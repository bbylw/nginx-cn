import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (revealed) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  return (
    <div
      ref={ref}
      className={`lp-reveal ${className}`}
      data-revealed={revealed ? "true" : "false"}
      style={delay > 0 ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

export function TaglineReveal({
  lines,
  className = "",
}: {
  lines: string[][];
  className?: string;
}) {
  const totalTokens = lines.reduce((sum, line) => sum + line.length, 0);
  const containerRef = useRef<HTMLParagraphElement | null>(null);
  const [litCount, setLitCount] = useState(() => (prefersReducedMotion() ? totalTokens : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setLitCount(totalTokens);
      return;
    }

    let rafId = 0;

    const updateProgress = () => {
      rafId = 0;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const startY = vh * 0.84;
      const endY = vh * 0.34;
      const raw = (startY - rect.top) / Math.max(1, startY - endY);
      const clamped = Math.min(1, Math.max(0, raw));
      const target = Math.round(clamped * totalTokens);
      setLitCount((prev) => (target > prev ? target : prev));
    };

    const scheduleUpdate = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [totalTokens]);

  let tokenIndex = 0;

  return (
    <p ref={containerRef} className={`lp-tagline-text ${className}`}>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} className="lp-tagline-line">
          {line.map((token) => {
            const currentIdx = tokenIndex++;
            const isLit = currentIdx < litCount;
            return (
              <span
                key={`${lineIdx}-${currentIdx}`}
                className="lp-tagline-word"
                data-lit={isLit ? "true" : "false"}
              >
                {token}
              </span>
            );
          })}
        </span>
      ))}
    </p>
  );
}
