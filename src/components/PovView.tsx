import { useEffect, useMemo, useState } from "react";
import horizon from "../assets/mars-horizon.jpg";
import jezero from "../assets/jezero.jpg";
import LayerMap, { Legend } from "./LayerMap";
import { LayerChips } from "./Panels";
import {
  HAZARDS, MAP, WAYPOINTS, WEATHER, evaPlan, fmt, hazD, pointAlong, routeStats, sampleAll,
  type LayerId, type Weather,
} from "../lib/marsData";

export const VIDEO_URL =
  "https://assets.science.nasa.gov/content/dam/science/missions/mars2020/2026/1%20-%20Perseverance_Rover_Path_Update_October_2026_004.mp4";

const WP_IDX = [1, 2, 4, 6, 10];

type Props = { layer: LayerId; setLayer: (l: LayerId) => void; weather: Weather; hour: number };

export default function PovView({ layer, setLayer, weather, hour }: Props) {
  const [t, setT] = useState(0.12);
  const [play, setPlay] = useState(true);
  const [screen, setScreen] = useState<"map" | "video">("map");
  const st = routeStats();
  const plan = evaPlan(15, weather);

  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setT((v) => (v >= 1 ? 0 : Math.min(1, v + 0.0015))), 100);
    return () => clearInterval(id);
  }, [play]);

  const p = pointAlong(t);
  const ro = useMemo(() => sampleAll(p.x / MAP.w, p.y / MAP.h, { weather, hour }), [p.x, p.y, weather, hour]);
  const walked = t * st.lengthM;
  const nextIdx = WP_IDX.findIndex((i) => i > p.seg);
  const nextName = nextIdx >= 0 ? WAYPOINTS[nextIdx].name : "Habitat airlock";
  const nextDist = nextIdx >= 0 ? st.cumM[WP_IDX[nextIdx]] - walked : st.lengthM - walked;
  const backDist = walked; // straight back along path
  const eva = t * plan.total;
  const o2 = Math.max(0, plan.lifeH - eva);
  const dose = ((ro.dose * eva) / 1000) * 1; // mSv approx
  const hazNear = useMemo(() => {
    let best = { d: Infinity, name: "" };
    for (const h of HAZARDS) {
      const d = (hazD(p.x, p.y, h) - 1) * Math.min(h.rx, h.ry) * (MAP.metersW / MAP.w);
      if (d < best.d) best = { d: Math.max(0, d), name: h.name };
    }
    return best;
  }, [p.x, p.y]);
  const hr = Math.round(88 + ro.slope * 1.5 + (WEATHER[weather].mult > 5 ? 28 : 0));
  const warn = weather === "storm" ? "SOLAR PARTICLE EVENT · RETURN TO SHELTER" : hazNear.d < 150 ? `HAZARD ${Math.round(hazNear.d)} m · ${hazNear.name.toUpperCase()}` : null;

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black" style={{ aspectRatio: "16 / 10", minHeight: 520 }}>
        <img src={horizon} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />

        {/* tablet */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-3 pb-3 sm:pb-6">
          <div className="relative w-[96%] max-w-[780px]" style={{ perspective: 1500 }}>
            {/* gloves */}
            <div className="absolute -bottom-16 -left-4 z-10 h-44 w-24 rotate-[14deg] rounded-t-[44px] bg-gradient-to-br from-zinc-100 to-zinc-400 shadow-2xl sm:-left-8 sm:w-32">
              <div className="absolute -top-6 left-[62%] h-16 w-9 rotate-[38deg] rounded-full bg-gradient-to-br from-zinc-100 to-zinc-400" />
            </div>
            <div className="absolute -bottom-16 -right-4 z-10 h-44 w-24 -rotate-[14deg] rounded-t-[44px] bg-gradient-to-bl from-zinc-100 to-zinc-400 shadow-2xl sm:-right-8 sm:w-32">
              <div className="absolute -top-6 right-[62%] h-16 w-9 -rotate-[38deg] rounded-full bg-gradient-to-bl from-zinc-100 to-zinc-400" />
            </div>

            <div
              className="relative rounded-[22px] border-[7px] border-zinc-800 bg-zinc-950 shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
              style={{ transform: "rotateX(16deg)", transformOrigin: "50% 100%" }}
            >
              {/* tablet header */}
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 font-mono text-[10px] text-white/60">
                <span>EVA-1 · MARSWALK ALPHA</span>
                <span className="flex gap-1">
                  {(["map", "video"] as const).map((s) => (
                    <button key={s} onClick={() => setScreen(s)} className={`rounded px-2 py-0.5 ${screen === s ? "bg-white text-black" : "text-white/60"}`}>
                      {s === "map" ? "MAP" : "PATH VIDEO"}
                    </button>
                  ))}
                </span>
                <span>SOL 412 · {String(Math.floor(hour)).padStart(2, "0")}:00 LMST</span>
              </div>
              <div className="relative">
                {screen === "map" ? (
                  <LayerMap layer={layer} weather={weather} hour={hour} astro={p} compact showLabels={false} />
                ) : (
                  <video src={VIDEO_URL} poster={jezero} muted loop autoPlay playsInline controls className="aspect-[1568/882] w-full bg-black object-cover" />
                )}
                {warn && screen === "map" && (
                  <div className="absolute inset-x-0 top-0 animate-pulse bg-red-600/90 px-3 py-1 text-center font-mono text-[11px] font-semibold text-white">{warn}</div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-px bg-white/10 font-mono text-[10px] text-white/70">
                <div className="bg-zinc-950 px-2 py-1.5"><div className="text-white/40">NEXT</div>{nextName}</div>
                <div className="bg-zinc-950 px-2 py-1.5"><div className="text-white/40">TO NEXT</div>{fmt(Math.max(0, nextDist), 0)} m</div>
                <div className="bg-zinc-950 px-2 py-1.5"><div className="text-white/40">RETURN</div>{fmt(backDist / 1000, 2)} km to hab</div>
              </div>
            </div>
          </div>
        </div>

        {/* visor */}
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 75% 85% at 50% 45%, transparent 52%, rgba(0,0,0,0.88) 100%)" }} />
        <div className="pointer-events-none absolute inset-3 rounded-[40px] border border-white/10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />

        {/* HUD */}
        <div className="pointer-events-none absolute left-1/2 top-5 flex -translate-x-1/2 gap-5 rounded-full bg-black/50 px-5 py-2 font-mono text-[11px] text-emerald-300 backdrop-blur sm:gap-8">
          <span>HR {hr}</span>
          <span>O₂ {fmt(o2, 1)} h</span>
          <span>DOSE {fmt(dose, 2)} mSv</span>
          <span className="hidden sm:inline">SUIT 29.6 kPa</span>
          <span className="hidden sm:inline">COMM 12 min</span>
        </div>
        <div className="pointer-events-none absolute left-6 top-20 hidden font-mono text-[11px] leading-5 text-emerald-300/80 md:block">
          <div>ELEV {fmt(ro.elev, 0)} m</div>
          <div>SLOPE {fmt(ro.slope, 1)}°</div>
          <div>TEMP {fmt(ro.temp, 0)} °C</div>
          <div>WIND {fmt(ro.wind, 1)} m/s</div>
        </div>
        <div className="pointer-events-none absolute right-6 top-20 hidden text-right font-mono text-[11px] leading-5 text-emerald-300/80 md:block">
          <div>DOSE {fmt(ro.dose, 1)} µSv/h</div>
          <div>{ro.mineral.toUpperCase()}</div>
          <div>HABIT {fmt(ro.habit * 100, 0)}</div>
          <div>EVA {fmt(eva, 1)} h / {fmt(plan.total, 1)} h</div>
        </div>
      </div>

      {/* controls */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center gap-3">
            <button onClick={() => setPlay(!play)} className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black">
              {play ? "Pause walk" : "Resume walk"}
            </button>
            <input type="range" min={0} max={1} step={0.001} value={t} onChange={(e) => { setPlay(false); setT(+e.target.value); }} className="flex-1 accent-white" />
            <span className="w-24 text-right font-mono text-xs text-white/60">{fmt(walked / 1000, 2)} km</span>
          </div>
          <LayerChips layer={layer} onChange={setLayer} />
          <div className="mt-4"><Legend layer={layer} weather={weather} /></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/65">
          <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/45">What you're seeing</div>
          First-person view from inside a pressure-suit helmet. The tablet strapped to the forearm shows the same Jezero map, with the crew position, the safe route and live hazard warnings.
        </div>
      </div>
    </div>
  );
}
