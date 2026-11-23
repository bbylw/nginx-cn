import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// @nimbus-ds/components 的 webpack UMD 产物引用 global（浏览器不存在）
// Vite define 已映射 global -> window，这里再做运行时兜底。
declare global {
  interface Window {
    global?: Window;
  }
}
if (typeof window !== "undefined" && !(window as Window).global) {
  (window as Window).global = window;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
