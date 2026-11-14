import { useState } from "react";
import LayerMap, { Legend } from "../components/LayerMap";
import Map3D from "../components/Map3D";
import PovView, { VIDEO_URL } from "../components/PovView";
import { EvaCard, Inspector, LayerChips, WeatherPicker } from "../components/Panels";
import { HAZARDS, LAYERS, WAYPOINTS, type LayerId, type Readout, type Weather } from "../lib/marsData";
import jezero from "../assets/jezero.jpg";

type Section = "2d" | "3d" | "pov";
const TREK_URL =
  "https://trek.nasa.gov/mars/#v=0.1&x=-20.55099999997765&y=20.55099999997765&z=2&p=urn%3Aogc%3Adef%3Acrs%3AIAU2000%3A%3A49918&d=&l=JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0%2Ctrue%2C1&l=JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd%2Ctrue%2C1&locale=&b=mars&e=-2413598.482394696%2C-1118423.6880723592%2C2413557.3803946963%2C1118464.7900723591&sfz=&w=";

const Toggle = ({ on, set, label }: { on: boolean; set: (b: boolean) => void; label: string }) => (
  <button onClick={() => set(!on)} className="flex items-center gap-2 text-xs text-white/70 hover:text-white">
    <span className={`relative h-4 w-7 rounded-full transition ${on ? "bg-white" : "bg-white/20"}`}>
      <span className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${on ? "left-3.5 bg-black" : "left-0.5 bg-white"}`} />
    </span>
    {label}
  </button>
);

export default function MapPage() {
  const [section, setSection] = useState<Section>("2d");
  const [layer, setLayer] = useState<LayerId>("imagery");
  const [weather, setWeather] = useState<Weather>("quiet");
  const [hour, setHour] = useState(14);
  const [route, setRoute] = useState(true);
  const [haz, setHaz] = useState(true);
  const [probe, setProbe] = useState<Readout | null>(null);
  const [pin, setPin] = useState<Readout | null>(null);
  const [trek, setTrek] = useState(false);

  const info = LAYERS.find((l) => l.id === layer)!;
  const secs: { id: Section; label: string; sub: string }[] = [
    { id: "2d", label: "2D map", sub: "Layers & data" },
    { id: "3d", label: "3D map", sub: "Terrain model" },
    { id: "pov", label: "POV", sub: "Tablet view" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-10">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-white/45">Jezero crater · 18.4°N 77.4°E</div>
          <h1 className="text-4xl font-light tracking-tight sm:text-5xl">Martian Map</h1>
          <p className="mt-3 max-w-xl text-sm text-white/60">
            A hyper-local view for a single spacewalk: terrain, radiation, minerals, chemistry and atmosphere on one safe route.
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-white/15 p-1">
          {secs.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`rounded-full px-5 py-2 text-sm transition ${section === s.id ? "bg-white text-black" : "text-white/65 hover:text-white"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* shared controls */}
      <div className="mb-5 grid gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">Data layer</div>
          <LayerChips layer={layer} onChange={setLayer} />
          <p className="mt-3 text-xs text-white/50">{info.blurb}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Toggle on={route} set={setRoute} label="Safe route & stops" />
            <Toggle on={haz} set={setHaz} label="Hazards" />
            {layer === "atmosphere" && (
              <label className="flex items-center gap-2 text-xs text-white/70">
                Local time {String(hour).padStart(2, "0")}:00
                <input type="range" min={0} max={23} value={hour} onChange={(e) => setHour(+e.target.value)} className="w-28 accent-white" />
              </label>
            )}
          </div>
        </div>
        <WeatherPicker weather={weather} onChange={setWeather} />
      </div>

      {section === "2d" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <LayerMap
                layer={layer} weather={weather} hour={hour} showRoute={route} showHazards={haz}
                onProbe={setProbe} onPin={setPin} pin={pin}
              />
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><Legend layer={layer} weather={weather} /></div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">Science stops</div>
                <ol className="space-y-3">
                  {WAYPOINTS.map((w, i) => (
                    <li key={w.id} className="flex gap-3 text-sm">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-400 text-[10px] font-bold text-black">{i + 1}</span>
                      <span><b className="font-medium">{w.name}</b> <span className="text-white/45">· {w.stop} min</span><br /><span className="text-white/55">{w.goal}</span></span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">Hazards to avoid</div>
                <ul className="space-y-2.5 text-sm">
                  {HAZARDS.map((h) => (
                    <li key={h.id} className="flex gap-3">
                      <span className="w-7 shrink-0 font-mono text-xs text-red-300">{h.id}</span>
                      <span><span className="text-white/85">{h.name}</span> <span className="text-white/45">· {h.kind}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <Inspector r={pin && !probe ? pin : probe} layer={layer} pinned={!!pin && !probe} />
            <EvaCard weather={weather} />
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <video src={VIDEO_URL} poster={jezero} controls preload="none" playsInline className="aspect-video w-full bg-black object-cover" />
              <div className="p-4 text-xs text-white/55">
                Source of this 2D basemap: NASA's <i>Perseverance Rover Path</i> update video (Jezero crater).
              </div>
            </div>
          </aside>
        </div>
      )}

      {section === "3d" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-3 flex gap-2">
              <button onClick={() => setTrek(false)} className={`rounded-full border px-4 py-1.5 text-xs ${!trek ? "border-white bg-white text-black" : "border-white/20 text-white/70"}`}>Terrain model</button>
              <button onClick={() => setTrek(true)} className={`rounded-full border px-4 py-1.5 text-xs ${trek ? "border-white bg-white text-black" : "border-white/20 text-white/70"}`}>NASA Trek · live data</button>
              <a href={TREK_URL} target="_blank" rel="noreferrer" className="ml-auto self-center text-xs text-white/60 underline underline-offset-4 hover:text-white">Open Trek in a new tab ↗</a>
            </div>
            {trek ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                <iframe title="NASA Mars Trek" src={TREK_URL} className="h-[460px] w-full sm:h-[560px]" />
                <div className="border-t border-white/10 p-3 text-xs text-white/50">
                  Jezero CTX 6 m and HiRISE 25 cm orthomosaics from NASA Trek. If the viewer is blank, your browser blocked embedding, so use the link above.
                </div>
              </div>
            ) : (
              <Map3D layer={layer} weather={weather} hour={hour} showRoute={route} showHazards={haz} />
            )}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><Legend layer={layer} weather={weather} /></div>
          </div>
          <aside className="space-y-5">
            <EvaCard weather={weather} />
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/60">
              <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/45">About this view</div>
              The terrain mesh is built from the elevation model and draped with the orbital image and your active data layer. The route (cyan), stops and hazard rings (red) follow the ground. Use <b className="text-white/80">NASA Trek · live data</b> to explore the real Jezero CTX and HiRISE mosaics.
            </div>
          </aside>
        </div>
      )}

      {section === "pov" && <PovView layer={layer} setLayer={setLayer} weather={weather} hour={hour} />}

      <p className="mt-10 max-w-3xl text-xs leading-5 text-white/35">
        Imagery is a frame from NASA's Perseverance Rover Path video. Elevation, radiation, mineral, chemistry and atmosphere layers are modelled illustrations registered to that frame, built to demonstrate the planning workflow. They are not measurements. Replace them with NASA Trek, MOLA, CRISM and RAD datasets for mission use.
      </p>
    </main>
  );
}
