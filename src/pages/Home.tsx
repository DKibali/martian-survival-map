import { useRef, useState } from "react";
import LayerMap from "../components/LayerMap";
import { VIDEO_URL } from "../components/PovView";
import { WeatherPicker } from "../components/Panels";
import { HAZARDS, WAYPOINTS, WEATHER, evaPlan, fmt, routeStats, type Weather } from "../lib/marsData";
import jezero from "../assets/jezero.jpg";

const go = (h: string) => () => { window.location.hash = h; };

const H2 = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="mb-10 max-w-2xl">
    <div className="mb-3 text-[11px] uppercase tracking-[0.25em] text-white/45">{k}</div>
    <h2 className="text-3xl font-light leading-tight tracking-tight sm:text-4xl">{children}</h2>
  </div>
);

export default function Home() {
  const vid = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [load, setLoad] = useState(15);
  const [weather, setWeather] = useState<Weather>("quiet");
  const plan = evaPlan(load, weather);
  const st = routeStats();

  const safety = [
    { n: "01", t: "Radiation", d: "No magnetic field and a thin atmosphere. The surface dose is about 100× Earth's, and a solar storm can multiply it within minutes.", tag: "≈ 0.64 mSv / sol" },
    { n: "02", t: "Pressure & cold", d: "Atmosphere is under 1% of Earth's and averages about −60 °C. A suit breach is a life-threatening failure.", tag: "610 Pa · −125 to +20 °C" },
    { n: "03", t: "Toxic dust", d: "Fine, sharp regolith carries perchlorates. It clogs seals, abrades suits and must stay out of the habitat.", tag: "≈ 0.5 wt % perchlorate" },
    { n: "04", t: "Terrain", d: "Soft dunes, boulder fields, craters and scarps. A fall in a pressurised suit can tear fabric or break a visor.", tag: "Keep slopes under 15°" },
    { n: "05", t: "Comm delay", d: "Mission Control is 4–24 minutes away one-way. Crews must decide and act on their own.", tag: "Autonomy first" },
    { n: "06", t: "Life support", d: "A backpack gives hours, not days. Every walk is planned around the way back, with a reserve that is never spent.", tag: "Return with 1 h reserve" },
  ];
  const rad = [
    { l: "Earth surface", v: 0.007 },
    { l: "Mars surface", v: 0.64 },
    { l: "Moon surface", v: 1.4 },
    { l: "Deep-space cruise", v: 1.84 },
  ];
  const rules = [
    ["Never walk alone", "Two suited crew minimum, with a third on comms and ready in the airlock."],
    ["Turn back at one third", "Life support and radiation budgets are checked against the way home, not the way out."],
    ["Shelter within reach", "On elevated space weather, stay within 30 minutes of the storm shelter. On a particle event, return now."],
    ["Stay out of the red zones", "Craters, scarps, trough walls, soft dunes and boulder fields are drawn on the map and the tablet warns you."],
    ["Dust discipline", "Brush down at the suit port. No dusty gear enters the cabin."],
    ["Call out every fall", "Any fall or suit alarm ends the science and starts the return."],
  ];

  return (
    <div>
      {/* VIDEO FIRST */}
      <section className="relative h-[82vh] min-h-[520px] w-full overflow-hidden bg-black">
        <video
          ref={vid}
          src={VIDEO_URL}
          poster={jezero}
          autoPlay muted loop playsInline preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/30" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-7xl flex-col gap-6 px-5 pb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-orange-300/90">Perseverance rover path · Jezero crater</div>
            <h1 className="text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
              Interplanetary Survival Guide:<br />
              <span className="text-orange-300">Martian Map</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/75">
              Follow the rover's real path, then plan how a human crew could walk the same ground, looking for life and staying alive.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={go("#/map")} className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-orange-200">Open the Map</button>
              <a href="#safety" className="rounded-full border border-white/40 px-6 py-3 text-sm hover:bg-white/10">Astronaut safety ↓</a>
            </div>
          </div>
          <button
            onClick={() => { setMuted(!muted); if (vid.current) vid.current.muted = !muted; }}
            className="self-start rounded-full border border-white/30 bg-black/40 px-4 py-2 text-xs backdrop-blur hover:bg-white/10 md:self-end"
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        </div>
      </section>

      {/* OBJECTIVE */}
      <section className="mx-auto max-w-7xl px-5 py-24">
        <H2 k="Scientific objective">Identify life and habitability, then get people there to find out.</H2>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Was Mars habitable?", "Clays, carbonates and delta layers in Jezero record a lake that existed billions of years ago."],
            ["Did life leave a trace?", "Carbonate and clay rocks preserve organic molecules. Humans can choose, core and cache the best samples faster than a robot."],
            ["Can humans live here?", "Radiation, dust, pressure and terrain decide how far from shelter a crew can safely go."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="mb-3 text-lg">{t}</h3>
              <p className="text-sm leading-6 text-white/60">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 max-w-3xl text-sm leading-7 text-white/55">
          Humans bring critical thinking, context and speed to science that robots can't match. Mars data exists, but it isn't yet layered for the hyper-local ground a crew will cover on one spacewalk. This guide layers topography, radiation, minerals, chemistry and atmosphere on a single route.
        </p>
      </section>

      {/* SAFETY */}
      <section id="safety" className="scroll-mt-20 border-y border-orange-400/20 bg-gradient-to-b from-orange-950/30 to-black">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <div className="mb-10 max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/40 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-orange-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-300" /> Priority one
            </div>
            <h2 className="text-4xl font-light leading-tight tracking-tight sm:text-6xl">Astronaut safety comes first.</h2>
            <p className="mt-5 text-lg text-white/70">Every layer on this map exists to answer one question: can the crew do this walk and come home?</p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {safety.map((s) => (
              <div key={s.n} className="bg-black p-7">
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-xs text-orange-300">{s.n}</span>
                  <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-[10px] text-white/60">{s.tag}</span>
                </div>
                <h3 className="mb-2 text-xl">{s.t}</h3>
                <p className="text-sm leading-6 text-white/60">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/60 p-7">
              <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-white/45">Radiation environment</div>
              <h3 className="mb-6 text-xl font-light">Daily dose, mSv per day</h3>
              <div className="space-y-4">
                {rad.map((r) => (
                  <div key={r.l}>
                    <div className="mb-1 flex justify-between text-sm text-white/70"><span>{r.l}</span><span className="font-mono text-xs">≈ {r.v}</span></div>
                    <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-orange-300 to-red-400" style={{ width: `${Math.max(1.5, (r.v / 1.84) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs leading-5 text-white/45">
                Values are approximate figures from NASA's Curiosity RAD instrument and lunar surface measurements. The Map tab adds a space-weather selector: a solar particle event can raise the dose rate by an order of magnitude, which is why shelter is never far.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/60 p-7">
              <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-white/45">Rules of the walk</div>
              <h3 className="mb-6 text-xl font-light">Non-negotiables</h3>
              <ul className="space-y-4">
                {rules.map(([t, d]) => (
                  <li key={t} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-300" />
                    <span><b className="font-medium text-white">{t}.</b> <span className="text-white/60">{d}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MARSWALK */}
      <section className="mx-auto max-w-7xl px-5 py-24">
        <H2 k="MarsWalk">One spacewalk, planned end to end.</H2>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <LayerMap layer="imagery" weather={weather} hour={14} showLabels />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-white/45">
              <span>Route Alpha: {fmt(st.lengthM / 1000, 1)} km loop · {WAYPOINTS.length} science stops · {HAZARDS.length} hazards avoided</span>
              <button onClick={go("#/map")} className="text-white underline underline-offset-4">Explore all layers →</button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Plan", "Pick science targets, then route around every red zone. The map reports your closest approach."],
                ["Walk", "Follow the tablet. It warns about slope, hazards, dose and the distance home."],
                ["Return", "Turn back by the one-third rule, brush down, and send the data to Earth."],
              ].map(([t, d], i) => (
                <div key={t} className="rounded-xl border border-white/10 p-4">
                  <div className="mb-1 font-mono text-xs text-orange-300">0{i + 1}</div>
                  <div className="mb-1 text-sm">{t}</div>
                  <p className="text-xs leading-5 text-white/55">{d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* planner */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 text-[11px] uppercase tracking-[0.18em] text-white/45">EVA planner</div>
            <label className="mb-1 flex justify-between text-sm text-white/75"><span>Science kit carried</span><span className="font-mono">{load} kg</span></label>
            <input type="range" min={0} max={40} value={load} onChange={(e) => setLoad(+e.target.value)} className="mb-5 w-full accent-orange-300" />
            <WeatherPicker weather={weather} onChange={setWeather} />
            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 text-sm">
              {[
                ["Walking pace", `${fmt(plan.speed, 1)} km/h`],
                ["Walking time", `${fmt(plan.walkH, 1)} h`],
                ["Sampling stops", `${fmt(plan.stopH, 1)} h`],
                ["Total EVA", `${fmt(plan.total, 1)} h`],
                ["Life support (usable)", `${fmt(plan.limitH, 1)} h`],
                ["Dose for the walk", `${fmt(plan.dose, 2)} mSv`],
              ].map(([k, v]) => (
                <div key={k} className="bg-black p-3.5"><div className="text-[11px] text-white/45">{k}</div><div className="font-mono text-base">{v}</div></div>
              ))}
            </div>
            <div className={`mt-4 rounded-lg px-3.5 py-3 text-sm ${weather === "storm" ? "bg-red-400/15 text-red-200" : plan.ok ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>
              {weather === "storm"
                ? `${WEATHER.storm.label}: EVA cancelled. Shelter now.`
                : plan.ok
                  ? "GO. This walk fits inside life support with a 1 h reserve."
                  : "NO-GO. Carry less, shorten the loop or split it over two EVAs."}
            </div>
            <p className="mt-3 text-[11px] leading-4 text-white/35">Planner assumptions: pace 2.8 km/h minus 0.035 per kg carried; metabolic rate 250 W + 7 W/kg; backpack rated for 8 h at 300 W; 1 h reserve.</p>
          </div>
        </div>
      </section>

      {/* MOBILITY */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-24">
          <H2 k="Motion & mobility">Moving in a pressurised suit, in 38% gravity.</H2>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              ["0.38 g", "A 120 kg suit and pack weighs about 45 kg on Mars. Light, but the mass still has to be stopped and turned."],
              ["Stiff joints", "Suits fight you at every bend. Kneeling, reaching and sampling cost more energy than walking."],
              ["Short strides", "A shuffling lope is safest. Hops look fun but make falls more likely on loose ground."],
              ["Slopes under 15°", "Steeper ground, soft sand and rocks above knee height are marked as hazards on the map."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-white/10 p-6">
                <div className="mb-3 text-2xl font-light text-orange-300">{t}</div>
                <p className="text-sm leading-6 text-white/60">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-xs text-white/45 md:flex-row md:justify-between">
          <div>Interplanetary Survival Guide: Martian Map. Imagery from NASA's Mars 2020 Perseverance Rover Path video.</div>
          <div className="flex gap-5">
            <a className="hover:text-white" href="https://trek.nasa.gov/mars/" target="_blank" rel="noreferrer">NASA Mars Trek ↗</a>
            <a className="hover:text-white" href="https://science.nasa.gov/mission/mars-2020-perseverance/" target="_blank" rel="noreferrer">Mars 2020 ↗</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
