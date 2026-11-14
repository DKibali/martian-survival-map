import { useEffect, useState } from "react";
import Home from "./pages/Home";
import MapPage from "./pages/MapPage";
import Research from "./pages/Research";
import Slides from "./pages/Slides";

const TABS = [
  { id: "", label: "Main", href: "#/" },
  { id: "map", label: "Map", href: "#/map" },
  { id: "research", label: "Research paper", href: "#/research" },
  { id: "slides", label: "Slide presentation", href: "#/slides" },
];

const route = () => window.location.hash.replace(/^#\/?/, "").split("?")[0];

export default function App() {
  const [r, setR] = useState(route());

  useEffect(() => {
    const on = () => {
      setR(route());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  useEffect(() => {
    const t = TABS.find((x) => x.id === r) ?? TABS[0];
    document.title = `${t.label} · Interplanetary Survival Guide: Martian Map`;
  }, [r]);

  const active = TABS.some((t) => t.id === r) ? r : "";

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <a href="#/" className="flex items-center gap-2.5 text-sm tracking-wide">
            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-orange-300 to-red-500" />
            <span className="hidden font-medium sm:inline">Martian Map</span>
          </a>
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <a
                key={t.id}
                href={t.href}
                title="Click to switch tab · Ctrl/Cmd-click to open in a new browser tab"
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs transition sm:px-4 sm:text-sm ${
                  active === t.id ? "bg-white text-black" : "text-white/65 hover:text-white"
                }`}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {active === "" && <Home />}
      {active === "map" && <MapPage />}
      {active === "research" && <Research />}
      {active === "slides" && <Slides />}
    </div>
  );
}
