import {
  COMP_LABELS, LAYERS, MINERALS, WEATHER, avgRouteDose, evaPlan, fmt, routeStats,
  type LayerId, type Readout, type Weather,
} from "../lib/marsData";

export function LayerChips({ layer, onChange }: { layer: LayerId; onChange: (l: LayerId) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {LAYERS.map((l) => (
        <button
          key={l.id}
          onClick={() => onChange(l.id)}
          className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
            layer === l.id ? "border-white bg-white text-black" : "border-white/20 text-white/70 hover:border-white/50 hover:text-white"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function WeatherPicker({ weather, onChange }: { weather: Weather; onChange: (w: Weather) => void }) {
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/45">Space weather</div>
      <div className="flex gap-1.5">
        {(Object.keys(WEATHER) as Weather[]).map((w) => (
          <button
            key={w}
            onClick={() => onChange(w)}
            className={`flex-1 rounded-lg border px-2 py-2 text-[11px] leading-tight transition ${
              weather === w ? "bg-white/10 text-white" : "border-white/10 text-white/55 hover:text-white"
            }`}
            style={weather === w ? { borderColor: WEATHER[w].color } : undefined}
          >
            <span className="mb-1 block h-1 w-full rounded-full" style={{ background: WEATHER[w].color, opacity: weather === w ? 1 : 0.4 }} />
            {WEATHER[w].label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-white/50">{WEATHER[weather].note}</p>
    </div>
  );
}

const Row = ({ k, v, hi }: { k: string; v: string; hi?: boolean }) => (
  <div className={`flex items-baseline justify-between py-1.5 text-sm ${hi ? "text-white" : "text-white/70"}`}>
    <span className={hi ? "font-medium" : ""}>{k}</span>
    <span className="font-mono text-[13px]">{v}</span>
  </div>
);

export function Inspector({ r, layer, pinned }: { r: Readout | null; layer: LayerId; pinned?: boolean }) {
  if (!r)
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/50">
        Hover over the map to read the terrain. Click to pin a point.
      </div>
    );
  const hi = (id: LayerId) => layer === id;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{pinned ? "Pinned point" : "Probe"}</div>
        <div className="font-mono text-[11px] text-white/50">≈ {fmt(r.lat, 4)}°N · {fmt(r.lon, 4)}°E</div>
      </div>
      {r.hazard && (
        <div className="mb-3 rounded-lg border border-red-400/40 bg-red-400/10 p-2.5 text-xs text-red-200">
          <b>{r.hazard.name}</b> · {r.hazard.kind}. {r.hazard.note}
        </div>
      )}
      <div className="divide-y divide-white/5">
        <Row hi={hi("topography")} k="Elevation" v={`${fmt(r.elev, 0)} m`} />
        <Row hi={hi("topography")} k="Slope" v={`${fmt(r.slope, 1)}°`} />
        <Row hi={hi("radiation")} k="Dose rate" v={`${fmt(r.dose, 1)} µSv/h`} />
        <Row hi={hi("radiation")} k="Per sol" v={`${fmt(r.dailyDose, 2)} mSv`} />
        <Row hi={hi("minerals")} k="Mineral unit" v={r.mineral} />
        <Row hi={hi("chemistry")} k="Habitability" v={`${fmt(r.habit * 100, 0)} / 100`} />
        <Row hi={hi("atmosphere")} k="Temperature" v={`${fmt(r.temp, 0)} °C`} />
        <Row hi={hi("atmosphere")} k="Pressure" v={`${fmt(r.pressure, 0)} Pa`} />
        <Row hi={hi("atmosphere")} k="Wind" v={`${fmt(r.wind, 1)} m/s`} />
        <Row hi={hi("atmosphere")} k="Dust opacity τ" v={fmt(r.tau, 2)} />
      </div>

      {layer === "minerals" && (
        <div className="mt-4 space-y-1.5">
          {MINERALS.map((m, i) => (
            <div key={m.id}>
              <div className="flex justify-between text-[11px] text-white/60"><span>{m.name}</span><span>{fmt(r.mineralWeights[i] * 100, 0)}%</span></div>
              <div className="h-1 rounded bg-white/10"><div className="h-1 rounded" style={{ width: `${r.mineralWeights[i] * 100}%`, background: `rgb(${m.color.join(",")})` }} /></div>
            </div>
          ))}
          <p className="pt-2 text-xs text-white/50">{MINERALS[r.mineralIdx].note}</p>
        </div>
      )}
      {layer === "chemistry" && (
        <div className="mt-4 space-y-1.5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Modelled composition (wt %)</div>
          {COMP_LABELS.map((c, i) => (
            <div key={c}>
              <div className="flex justify-between text-[11px] text-white/60"><span>{c}</span><span>{fmt(r.comp[i], 1)}</span></div>
              <div className="h-1 rounded bg-white/10"><div className="h-1 rounded bg-emerald-300" style={{ width: `${Math.min(100, r.comp[i] * 2)}%` }} /></div>
            </div>
          ))}
          <p className="pt-2 text-xs text-white/50">Organic-preservation index {fmt(r.organics * 100, 0)}/100. Perchlorate ≈ 0.5 wt % in dust, so wash gear before re-entry.</p>
        </div>
      )}
    </div>
  );
}

export function EvaCard({ weather, loadKg = 15 }: { weather: Weather; loadKg?: number }) {
  const st = routeStats();
  const plan = evaPlan(loadKg, weather);
  const dose = avgRouteDose(weather);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/45">MarsWalk route Alpha</div>
      <Row k="Loop length" v={`${fmt(st.lengthM / 1000, 1)} km`} />
      <Row k="Closest hazard" v={`${fmt(st.minClearance, 0)} m · ${st.minHazard}`} />
      <Row k="Steepest step" v={`${fmt(st.maxSlope, 0)}°`} />
      <Row k={`EVA time (${loadKg} kg kit)`} v={`${fmt(plan.total, 1)} h`} />
      <Row k="Route dose" v={`${fmt(dose, 0)} µSv/h → ${fmt((dose * plan.total) / 1000, 2)} mSv`} />
      <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${weather === "storm" ? "bg-red-400/15 text-red-200" : "bg-emerald-400/10 text-emerald-200"}`}>
        {weather === "storm" ? "EVA not permitted during a solar particle event." : "Within life-support limits with a 1 h reserve."}
      </div>
    </div>
  );
}
