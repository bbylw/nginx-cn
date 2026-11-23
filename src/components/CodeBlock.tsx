import { useId } from "react";
import CopyAction from "./CopyAction";

export default function CodeBlock({ code, title }: { code: string; title?: string }) {
  const captionId = useId();

  return (
    <figure className="codeblock">
      <div className="codeblock-head">
        <figcaption id={captionId} className="codeblock-title">
          {title ?? "code"}
        </figcaption>
        <CopyAction text={code} label="复制代码" />
      </div>
      <pre role="region" aria-labelledby={captionId} tabIndex={0}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
