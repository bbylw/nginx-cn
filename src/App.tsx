import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";

const Docs = lazy(() => import("./pages/Docs"));
const ModuleIndex = lazy(() =>
  import("./pages/Modules").then((m) => ({ default: m.ModuleIndex }))
);
const ModulePage = lazy(() =>
  import("./pages/Modules").then((m) => ({ default: m.ModulePage }))
);
const Legal = lazy(() => import("./pages/Legal"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const targetId = hash.slice(1);
      const raf = window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView();
      });
      return () => window.cancelAnimationFrame(raf);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

function RouteSkeleton() {
  return (
    <div className="route-skeleton" aria-busy="true" aria-label="正在加载页面">
      <div className="route-skeleton-bar is-short" />
      <div className="route-skeleton-bar is-title" />
      <div className="route-skeleton-bar is-body" />
      <div className="route-skeleton-bar is-body" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollTop />
      <div className="scroll-progress" aria-hidden="true" />
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs/modules" element={<ModuleIndex />} />
            <Route path="/docs/modules/:slug" element={<ModulePage />} />
            <Route path="/docs/:slug" element={<Docs />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
