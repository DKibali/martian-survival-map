import { useEffect, useRef, useState } from "react";
import jezero from "../assets/jezero.jpg";
import {
  HAB, HAZARDS, MAP, MINERALS, ROUTE, WAYPOINTS, WEATHER, renderLayer, sampleAll, windAt,
  type LayerId, type Readout, type Weather,
} from "../lib/marsData";

type Props = {
  layer: LayerId;
  weather: Weather;
  hour: number;
  showRoute?: boolean;
  showHazards?: boolean;
  showLabels?: boolean;
  astro?: { x: number; y: number; heading: number } | null;
  onProbe?: (r: Readout | null) => void;
  onPin?: (r: Readout) => void;
  pin?: Readout | null;
  className?: string;
  compact?: boolean;
};

export default function LayerMap({
  layer, weather, hour, showRoute = true, showHazards = true, showLabels = true,
  astro, onProbe, onPin, pin, className = "", compact,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const windCv = useRef<HTMLCanvasElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (overlay.current) renderLayer(overlay.current, layer, { weather, hour }, compact ? 220 : 320);
  }, [layer, weather, layer === "atmosphere" ? hour : 0, compact]);

  // wind particles
  useEffect(() => {
    const cv = windCv.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    g.clearRect(0, 0, cv.width, cv.height);
    if (layer !== "atmosphere") return;
    const GW = 40, GH = 23;
    const grid: { dx: number; dy: number }[] = [];
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) grid.push(windAt(i / GW, j / GH, hour));
    const N = compact ? 160 : 320;
    const p = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), age: Math.random() * 80 }));
    let raf = 0;
    const step = () => {
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = "rgba(0,0,0,0.07)";
      g.fillRect(0, 0, cv.width, cv.height);
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = "rgba(255,255,255,0.85)";
      g.lineWidth = 1.2;
      for (const q of p) {
        const w = grid[Math.min(GH - 1, Math.floor(q.y * GH)) * GW + Math.min(GW - 1, Math.floor(q.x * GW))];
        const nx = q.x + (w.dx / 12) * 0.0025, ny = q.y + (w.dy / 12) * 0.0045;
        g.beginPath();
        g.moveTo(q.x * cv.width, q.y * cv.height);
        g.lineTo(nx * cv.width, ny * cv.height);
        g.stroke();
        q.x = nx; q.y = ny; q.age++;
        if (q.age > 90 || q.x < 0 || q.x > 1 || q.y < 0 || q.y > 1) {
          q.x = Math.random(); q.y = Math.random(); q.age = 0;
        }
      }
      raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, [layer, hour, compact]);

  const uv = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { u: (e.clientX - r.left) / r.width, v: (e.clientY - r.top) / r.height };
  };
  const move = (e: React.PointerEvent) => {
    if (!onProbe) return;
    const { u, v } = uv(e);
    setCursor({ x: u, y: v });
    onProbe(sampleAll(u, v, { weather, hour }));
  };

  const pct = (x: number, y: number) => ({ left: `${(x / MAP.w) * 100}%`, top: `${(y / MAP.h) * 100}%` });
  const routePts = ROUTE.map((p) => p.join(",")).join(" ");

  return (
    <div
      ref={box}
      className={`relative w-full select-none overflow-hidden bg-black ${onProbe ? "cursor-crosshair" : ""} ${className}`}
      style={{ aspectRatio: `${MAP.w} / ${MAP.h}` }}
      onPointerMove={move}
      onPointerLeave={() => { setCursor(null); onProbe?.(null); }}
      onClick={(e) => {
        if (!onPin) return;
        const { u, v } = uv(e as unknown as React.PointerEvent);
        onPin(sampleAll(u, v, { weather, hour }));
      }}
    >
      <img src={jezero} alt="Jezero crater orbital view" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <canvas ref={overlay} className="absolute inset-0 h-full w-full" />
      <canvas ref={windCv} width={640} height={360} className="pointer-events-none absolute inset-0 h-full w-full" />

      <svg viewBox={`0 0 ${MAP.w} ${MAP.h}`} className="pointer-events-none absolute inset-0 h-full w-full">
        {showHazards &&
          HAZARDS.map((h) => (
            <ellipse
              key={h.id} cx={h.x} cy={h.y} rx={h.rx} ry={h.ry}
              transform={`rotate(${h.rot} ${h.x} ${h.y})`}
              fill="rgba(248,113,113,0.16)" stroke="#f87171" strokeWidth={1.6}
              strokeDasharray="6 5" vectorEffect="non-scaling-stroke"
            />
          ))}
        {showRoute && (
          <>
            <polyline points={routePts} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <polyline points={routePts} fill="none" stroke="#67e8f9" strokeWidth={2.4} strokeLinejoin="round" strokeDasharray="9 6" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>

      {showHazards && showLabels && !compact &&
        HAZARDS.map((h) => (
          <span key={h.id} style={pct(h.x, h.y)} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded bg-black/55 px-1 font-mono text-[9px] text-red-300">
            {h.id}
          </span>
        ))}

      {showRoute && (
        <>
          <span style={pct(HAB.x, HAB.y)} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2">
            <span className="grid h-5 w-5 place-items-center rounded-sm bg-white text-[10px] font-bold text-black">H</span>
          </span>
          {WAYPOINTS.map((w, i) => (
            <span key={w.id} style={pct(w.x, w.y)} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2">
              <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-cyan-400 text-[10px] font-bold text-black shadow">
                {i + 1}
              </span>
              {showLabels && !compact && (
                <span className="absolute left-6 top-0 whitespace-nowrap rounded bg-black/65 px-1.5 py-0.5 text-[10px] text-white">{w.name}</span>
              )}
            </span>
          ))}
        </>
      )}

      {astro && (
        <span style={pct(astro.x, astro.y)} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2">
          <span className="absolute -inset-3 animate-ping rounded-full bg-amber-300/40" />
          <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-400" />
          <span
            className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2"
            style={{ transform: `translate(-50%,-50%) rotate(${astro.heading}deg)` }}
          >
            <span className="absolute left-3 top-[-5px] block border-y-[5px] border-l-[10px] border-y-transparent border-l-amber-300" />
          </span>
        </span>
      )}

      {pin && (
        <span style={pct(pin.u * MAP.w, pin.v * MAP.h)} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2">
          <span className="block h-4 w-4 rotate-45 border-2 border-white bg-fuchsia-500/80" />
        </span>
      )}

      {cursor && onProbe && (
        <>
          <span className="pointer-events-none absolute top-0 h-full w-px bg-white/35" style={{ left: `${cursor.x * 100}%` }} />
          <span className="pointer-events-none absolute left-0 h-px w-full bg-white/35" style={{ top: `${cursor.y * 100}%` }} />
        </>
      )}

      {/* scale bar */}
      {!compact && (
        <div
          className="pointer-events-none absolute bottom-3 right-3 text-center font-mono text-[10px] text-white drop-shadow"
          style={{ width: `${(1000 / MAP.metersW) * 100}%` }}
        >
          <div className="h-1.5 w-full border-x border-b border-white" />
          <div>1 km</div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ legend ------------------------------ */
export function Legend({ layer, weather }: { layer: LayerId; weather: Weather }) {
  const bar = (css: string, a: string, b: string) => (
    <div>
      <div className="h-2 rounded-full" style={{ background: css }} />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-white/50"><span>{a}</span><span>{b}</span></div>
    </div>
  );
  if (layer === "imagery")
    return <p className="text-xs text-white/50">Orbital image cropped from NASA's Perseverance Rover Path video. Route, hazards and stops are drawn on top.</p>;
  if (layer === "topography")
    return bar("linear-gradient(90deg,#283c8c,#3c96aa,#78be78,#e6d26e,#dc8246,#faf0eb)", "−2575 m", "−2440 m");
  if (layer === "radiation") {
    const c = WEATHER[weather].color;
    return bar(`linear-gradient(90deg, ${c}55, ${c})`, "lower dose", "higher dose");
  }
  if (layer === "minerals")
    return (
      <ul className="grid grid-cols-1 gap-1 text-xs text-white/70 sm:grid-cols-2">
        {MINERALS.map((m) => (
          <li key={m.id} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: `rgb(${m.color.join(",")})` }} />{m.name}
          </li>
        ))}
      </ul>
    );
  if (layer === "chemistry")
    return bar("linear-gradient(90deg,#1e1446,#3c4696,#1e96a0,#6ecd6e,#faeb5a)", "low potential", "high potential");
  return bar("linear-gradient(90deg,#3246be,#9696be,#ffa046)", "cold (−95 °C)", "warm (+5 °C)");
}
