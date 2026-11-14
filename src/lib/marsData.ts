// Shared Mars data model for the Martian Map.
// Geometry is registered to a frame taken from NASA's Perseverance Rover Path video (Jezero crater).
// Layer values are modelled illustrations; swap in Trek / MOLA / CRISM / RAD tiles when available.

export const MAP = {
  w: 1568,
  h: 882,
  metersW: 4927, // ~1000 m scale bar in the source video = 197 px @1280 → crop covers ~4.9 km
  metersH: 2771,
  lat: 18.44,
  lon: 77.42,
};

export type LayerId =
  | "imagery"
  | "topography"
  | "radiation"
  | "minerals"
  | "chemistry"
  | "atmosphere";

export const LAYERS: { id: LayerId; label: string; blurb: string }[] = [
  { id: "imagery", label: "Imagery", blurb: "HiRISE-class orbital view from NASA's rover-path video" },
  { id: "topography", label: "Topography", blurb: "Elevation tint with 5 m contours" },
  { id: "radiation", label: "Radiation", blurb: "Surface dose rate under current space weather" },
  { id: "minerals", label: "Minerals", blurb: "Dominant mineral unit from orbital spectra" },
  { id: "chemistry", label: "Chemistry", blurb: "Habitability & biosignature potential" },
  { id: "atmosphere", label: "Atmosphere", blurb: "Temperature, dust and wind" },
];

export type Weather = "quiet" | "elevated" | "storm";
export const WEATHER: Record<Weather, { label: string; mult: number; note: string; color: string }> = {
  quiet: { label: "Quiet Sun", mult: 1, note: "Galactic cosmic rays only. Normal EVA operations.", color: "#5eead4" },
  elevated: { label: "Elevated", mult: 2.4, note: "Energetic particles rising. Shorten EVA, stay within 30 min of shelter.", color: "#fbbf24" },
  storm: { label: "Solar particle event", mult: 11, note: "Abort EVA. Return to the storm shelter immediately.", color: "#f87171" },
};

/* ------------------------------ noise ------------------------------ */
function hash(x: number, y: number, s: number) {
  let h = x * 374761393 + y * 668265263 + s * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}
function vnoise(x: number, y: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function fbm(x: number, y: number, s: number, oct = 4) {
  let v = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) {
    v += a * vnoise(x * f, y * f, s + i * 17);
    n += a; a *= 0.5; f *= 2.07;
  }
  return v / n; // 0..1
}
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* --------------------------- features (px space) --------------------------- */
export type Hazard = {
  id: string; name: string; kind: string; note: string;
  x: number; y: number; rx: number; ry: number; rot: number; // rot in degrees
};
export const HAZARDS: Hazard[] = [
  { id: "H1", name: "NE crater rim", kind: "Crater / steep rim", note: "Rim slopes above 25°. Do not approach.", x: 1270, y: 30, rx: 62, ry: 58, rot: 0 },
  { id: "H2", name: "NE crater 2", kind: "Crater / steep rim", note: "Loose ejecta and rim blocks.", x: 1525, y: 50, rx: 56, ry: 54, rot: 0 },
  { id: "H3", name: "Dark dune lobe", kind: "Soft sand", note: "Entrapment and ankle-depth sinkage risk for a suited walker.", x: 745, y: 610, rx: 62, ry: 150, rot: 4 },
  { id: "H4", name: "Ripple crater", kind: "Crater", note: "Shallow bowl with megaripples. Footing unstable.", x: 860, y: 540, rx: 50, ry: 50, rot: 0 },
  { id: "H5", name: "Erosion trough", kind: "Trough / slope", note: "Narrow channel with 20°+ walls. Cross only at the head.", x: 452, y: 667, rx: 270, ry: 34, rot: 27 },
  { id: "H6", name: "Boulder cluster", kind: "Large rocks", note: "Blocks over 1 m. Snag and fall hazard.", x: 1090, y: 325, rx: 62, ry: 56, rot: 0 },
  { id: "H7", name: "Shadowed basin", kind: "Steep basin", note: "Poor visibility and cold-soaked ground.", x: 1495, y: 800, rx: 95, ry: 85, rot: 0 },
  { id: "H8", name: "Scarp ridge", kind: "Scarp", note: "Ridge face of 15°+ with loose cobbles.", x: 672, y: 170, rx: 26, ry: 175, rot: 8 },
];

export type Waypoint = { id: string; name: string; x: number; y: number; goal: string; stop: number }; // stop = minutes
export const HAB = { x: 560, y: 830 };
export const WAYPOINTS: Waypoint[] = [
  { id: "S1", name: "Spherule plain", x: 820, y: 850, goal: "Sample regolith and sort grain sizes", stop: 20 },
  { id: "S2", name: "Layered outcrop", x: 960, y: 730, goal: "Look for clay-bearing layers that record water", stop: 35 },
  { id: "S3", name: "Carbonate blocks", x: 1040, y: 450, goal: "Core a carbonate-rich block (possible biosignature host)", stop: 40 },
  { id: "S4", name: "Scarp base", x: 930, y: 215, goal: "Read the stratigraphy at the delta scarp", stop: 30 },
  { id: "S5", name: "Ridge overlook", x: 1190, y: 470, goal: "Photograph the route and relay data to orbit", stop: 15 },
];
// Safe route: loop out along the southern plain, up the east side, and back
export const ROUTE: [number, number][] = [
  [HAB.x, HAB.y],
  [820, 850],
  [960, 730],
  [1010, 600],
  [1040, 450],
  [985, 320],
  [930, 215],
  [1010, 190],
  [1160, 215],
  [1255, 320],
  [1240, 430],
  [1190, 470],
  [1150, 620],
  [1050, 770],
  [900, 850],
  [HAB.x, HAB.y],
];

/* ---------------------------- terrain model ---------------------------- */
function toLocal(x: number, y: number, h: Hazard) {
  const a = (-h.rot * Math.PI) / 180;
  const dx = x - h.x, dy = y - h.y;
  return { lx: dx * Math.cos(a) - dy * Math.sin(a), ly: dx * Math.sin(a) + dy * Math.cos(a) };
}
// normalised elliptical distance: <1 inside hazard
function hazD(x: number, y: number, h: Hazard) {
  const { lx, ly } = toLocal(x, y, h);
  return Math.hypot(lx / h.rx, ly / h.ry);
}

export function elevationAt(u: number, v: number) {
  const x = u * MAP.w, y = v * MAP.h;
  let e = -2540 + 70 * (u * 0.6 + (1 - v) * 0.4) + 16 * fbm(u * 7, v * 4.5, 3);
  e += 6 * fbm(u * 28, v * 16, 9, 3);
  for (const h of HAZARDS) {
    const d = hazD(x, y, h);
    if (h.id === "H1" || h.id === "H2" || h.id === "H4") {
      const depth = h.id === "H4" ? 9 : 26;
      if (d < 1) e -= depth * (1 - d * d);
      else e += depth * 0.35 * Math.exp(-Math.pow((d - 1.05) * 5, 2));
    } else if (h.id === "H5") e -= 14 * Math.exp(-d * d * 1.4);
    else if (h.id === "H3") e -= 12 * Math.exp(-d * d * 1.2);
    else if (h.id === "H7") e -= 24 * Math.exp(-d * d);
    else if (h.id === "H8") e += 22 * Math.exp(-d * d * 1.5);
    else if (h.id === "H6") e += 9 * Math.exp(-d * d);
  }
  return e;
}

const DX = MAP.metersW, DY = MAP.metersH;
export function slopeAt(u: number, v: number) {
  const e = 0.004;
  const gx = (elevationAt(u + e, v) - elevationAt(u - e, v)) / (2 * e * DX);
  const gy = (elevationAt(u, v + e) - elevationAt(u, v - e)) / (2 * e * DY);
  return (Math.atan(Math.hypot(gx, gy)) * 180) / Math.PI;
}

export const MINERALS = [
  { id: "olivine", name: "Olivine-rich basalt", color: [143, 205, 79] as number[], note: "Igneous floor unit; records magma and some alteration." },
  { id: "carbonate", name: "Mg-Fe carbonate", color: [79, 195, 247] as number[], note: "Forms in water. Prime host for preserved biosignatures." },
  { id: "clay", name: "Phyllosilicate clay", color: [198, 120, 221] as number[], note: "Smectite clays trap and preserve organic molecules." },
  { id: "sulfate", name: "Hydrated sulfate", color: [244, 211, 94] as number[], note: "Evaporite signature of drying lakes." },
  { id: "pyroxene", name: "Pyroxene sand", color: [224, 122, 95] as number[], note: "Wind-blown mafic sand. Soft ground." },
];
const COMP = [
  [44, 19, 14, 6, 8, 1.5, 0.5],
  [38, 14, 21, 8, 6, 1.0, 0.4],
  [46, 17, 10, 4, 14, 2.0, 0.6],
  [33, 13, 9, 12, 5, 17, 0.8],
  [47, 19, 9, 7, 9, 2.0, 0.6],
];
export const COMP_LABELS = ["SiO₂", "FeO", "MgO", "CaO", "Al₂O₃", "SO₃", "Cl"];

function mineralWeights(u: number, v: number) {
  const x = u * MAP.w, y = v * MAP.h;
  const f = MINERALS.map((_, i) => fbm(u * 5 + i * 3.1, v * 3.2 + i * 1.7, 40 + i * 5, 3) * 1.0);
  const dune = hazD(x, y, HAZARDS[2]);
  const trough = hazD(x, y, HAZARDS[4]);
  f[0] += 0.25 * (1 - u) * (v > 0.5 ? 1 : 0.2) + 0.1;
  f[1] += 0.28 * clamp((u - 0.55) * 3.5) + (hazD(x, y, HAZARDS[5]) < 1.5 ? 0.25 : 0);
  f[2] += 0.5 * Math.exp(-trough * trough * 0.8) + 0.12 * (1 - u);
  f[3] += 0.22 * clamp((0.4 - v) * 3) * (u < 0.7 ? 1 : 0.4);
  f[4] += 0.7 * Math.exp(-dune * dune * 0.9) + 0.1 * (1 - v);
  // sharpen
  const e = f.map((q) => Math.exp(q * 9));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((q) => q / s);
}

export type Ctx = { weather: Weather; hour: number };

export function doseRate(u: number, v: number, weather: Weather) {
  const e = elevationAt(u, v);
  const s = slopeAt(u, v);
  const base = 26.6 + 0.012 * (e + 2500) - 0.7 * clamp(s / 25) + 0.5 * (fbm(u * 9, v * 6, 77) - 0.5);
  return base * WEATHER[weather].mult; // µSv/h
}

export function tempAt(u: number, v: number, hour: number) {
  const e = elevationAt(u, v);
  return -45 + 40 * Math.sin(((hour - 9) / 24) * Math.PI * 2) - 0.006 * (e + 2500) + 3 * (fbm(u * 6, v * 4, 55) - 0.5);
}
export function windAt(u: number, v: number, hour: number) {
  const a = fbm(u * 2.2, v * 1.6, 61, 3) * Math.PI * 1.6 + 0.6 + 0.4 * Math.sin((hour / 24) * Math.PI * 2);
  const sp = 3.2 + 4.2 * fbm(u * 3, v * 2, 63, 3) + 2.2 * Math.max(0, Math.sin(((hour - 8) / 24) * Math.PI * 2));
  return { dx: Math.cos(a) * sp, dy: Math.sin(a) * sp, speed: sp };
}
export function dustTau(u: number, v: number) {
  return 0.42 + 0.22 * fbm(u * 4, v * 3, 71, 3);
}

export type Readout = {
  u: number; v: number; lat: number; lon: number;
  elev: number; slope: number;
  mineral: string; mineralWeights: number[]; mineralIdx: number;
  dose: number; dailyDose: number;
  habit: number; organics: number;
  comp: number[];
  temp: number; pressure: number; wind: number; windDir: number; tau: number;
  hazard: Hazard | null;
};

export function habitability(u: number, v: number, w?: number[]) {
  const mw = w ?? mineralWeights(u, v);
  const aq = mw[1] * 1.0 + mw[2] * 0.95 + mw[3] * 0.55 + mw[0] * 0.2;
  const calm = 1 - clamp(slopeAt(u, v) / 25);
  const org = fbm(u * 6, v * 5, 91, 3);
  return { habit: clamp(0.15 + 0.6 * aq + 0.12 * calm + 0.2 * (org - 0.4)), organics: org };
}

export function sampleAll(u: number, v: number, ctx: Ctx): Readout {
  u = clamp(u); v = clamp(v);
  const e = elevationAt(u, v);
  const mw = mineralWeights(u, v);
  const mi = mw.indexOf(Math.max(...mw));
  const { habit, organics } = habitability(u, v, mw);
  const comp = COMP_LABELS.map((_, k) => mw.reduce((a, w, i) => a + w * COMP[i][k], 0));
  const t = tempAt(u, v, ctx.hour);
  const w = windAt(u, v, ctx.hour);
  const dose = doseRate(u, v, ctx.weather);
  const x = u * MAP.w, y = v * MAP.h;
  const hz = HAZARDS.find((h) => hazD(x, y, h) < 1) ?? null;
  return {
    u, v,
    lat: MAP.lat + (0.5 - v) * (MAP.metersH / 59200),
    lon: MAP.lon + (u - 0.5) * (MAP.metersW / (59200 * Math.cos((MAP.lat * Math.PI) / 180))),
    elev: e, slope: slopeAt(u, v),
    mineral: MINERALS[mi].name, mineralWeights: mw, mineralIdx: mi,
    dose, dailyDose: (dose * 24) / 1000,
    habit, organics, comp,
    temp: t, pressure: 610 * Math.exp(-e / 11100) * (1 + 0.04 * Math.sin(((ctx.hour - 4) / 24) * Math.PI * 2)),
    wind: w.speed, windDir: (Math.atan2(w.dy, w.dx) * 180) / Math.PI, tau: dustTau(u, v),
    hazard: hz,
  };
}

/* ----------------------------- route analysis ----------------------------- */
export function pointAlong(t: number) {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < ROUTE.length; i++) {
    const d = Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]);
    segs.push(d); total += d;
  }
  let target = clamp(t) * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? clamp(target / segs[i]) : 0;
      const x = lerp(ROUTE[i][0], ROUTE[i + 1][0], f), y = lerp(ROUTE[i][1], ROUTE[i + 1][1], f);
      const heading = (Math.atan2(ROUTE[i + 1][1] - ROUTE[i][1], ROUTE[i + 1][0] - ROUTE[i][0]) * 180) / Math.PI;
      return { x, y, heading, seg: i };
    }
    target -= segs[i];
  }
  return { x: ROUTE[0][0], y: ROUTE[0][1], heading: 0, seg: 0 };
}

let cachedStats: ReturnType<typeof computeStats> | null = null;
function computeStats() {
  let len = 0;
  let minClear = Infinity, minHaz = "";
  let maxSlope = 0, slopeSum = 0, n = 0;
  const cum: number[] = [0];
  for (let i = 1; i < ROUTE.length; i++) {
    const d = Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]);
    len += d; cum.push(len);
  }
  const steps = Math.round(len / 6);
  for (let k = 0; k <= steps; k++) {
    const p = pointAlong(k / steps);
    for (const h of HAZARDS) {
      const dn = hazD(p.x, p.y, h);
      const clear = (dn - 1) * Math.min(h.rx, h.ry) * (MAP.metersW / MAP.w);
      if (clear < minClear) { minClear = clear; minHaz = h.name; }
    }
    const s = slopeAt(p.x / MAP.w, p.y / MAP.h);
    maxSlope = Math.max(maxSlope, s); slopeSum += s; n++;
  }
  const mpp = MAP.metersW / MAP.w;
  return {
    lengthM: len * mpp,
    minClearance: Math.max(0, minClear), minHazard: minHaz,
    maxSlope, avgSlope: slopeSum / n,
    cumM: cum.map((c) => c * mpp),
    stopMinutes: WAYPOINTS.reduce((a, w) => a + w.stop, 0),
  };
}
export function routeStats() {
  if (!cachedStats) cachedStats = computeStats();
  return cachedStats;
}
export function avgRouteDose(weather: Weather) {
  let s = 0, n = 0;
  for (let k = 0; k <= 40; k++) {
    const p = pointAlong(k / 40);
    s += doseRate(p.x / MAP.w, p.y / MAP.h, weather); n++;
  }
  return s / n;
}

// EVA planner (design assumptions, documented in the UI)
export function evaPlan(loadKg: number, weather: Weather) {
  const st = routeStats();
  const speed = clamp(2.8 - 0.035 * loadKg, 1.2, 3); // km/h on this terrain
  const walkH = st.lengthM / 1000 / speed;
  const stopH = st.stopMinutes / 60;
  const total = walkH + stopH;
  const metabolic = 250 + 7 * loadKg; // W
  const lifeH = (8 * 300) / metabolic; // PLSS rated 8 h at 300 W
  const reserve = 1;
  const dose = (avgRouteDose(weather) * total) / 1000; // mSv
  const limitH = lifeH - reserve;
  return { speed, walkH, stopH, total, metabolic, lifeH, limitH, ok: total <= limitH, dose };
}

/* ----------------------------- rendering ----------------------------- */
function ramp(stops: [number, number[]][], t: number) {
  t = clamp(t);
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
      const f = (t - t0) / (t1 - t0);
      return [lerp(c0[0], c1[0], f), lerp(c0[1], c1[1], f), lerp(c0[2], c1[2], f)];
    }
  }
  return stops[stops.length - 1][1];
}
const TOPO = [
  [0, [40, 60, 140]], [0.25, [60, 150, 170]], [0.45, [120, 190, 120]],
  [0.65, [230, 210, 110]], [0.85, [220, 130, 70]], [1, [250, 240, 235]],
] as [number, number[]][];
const HABIT_RAMP = [
  [0, [30, 20, 70]], [0.3, [60, 70, 150]], [0.55, [30, 150, 160]], [0.8, [110, 205, 110]], [1, [250, 235, 90]],
] as [number, number[]][];
const TEMP = [
  [0, [50, 70, 190]], [0.5, [150, 150, 190]], [1, [255, 160, 70]],
] as [number, number[]][];

export const ELEV_MIN = -2575, ELEV_MAX = -2440;

export function renderLayer(canvas: HTMLCanvasElement, layer: LayerId, ctx: Ctx, res = 320) {
  const W = res, H = Math.round((res * MAP.h) / MAP.w);
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext("2d")!;
  g.clearRect(0, 0, W, H);
  if (layer === "imagery") return;
  const img = g.createImageData(W, H);
  const tier = ctx.weather === "quiet" ? [[20, 150, 130], [120, 235, 190]] : ctx.weather === "elevated" ? [[160, 100, 10], [255, 215, 80]] : [[150, 20, 30], [255, 110, 90]];
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const u = i / W, v = j / H;
      let c = [0, 0, 0], a = 0.7;
      if (layer === "topography") {
        const e = elevationAt(u, v);
        c = ramp(TOPO, (e - ELEV_MIN) / (ELEV_MAX - ELEV_MIN));
        const f = (e / 5) % 1;
        const fr = f < 0 ? f + 1 : f;
        if (fr < 0.07 || fr > 0.93) c = [30, 20, 20];
        // hillshade
        const sh = (elevationAt(u - 0.004, v - 0.004) - elevationAt(u + 0.004, v + 0.004)) * 0.06;
        c = c.map((q) => clamp(q + sh * 40, 0, 255));
        a = 0.62;
      } else if (layer === "radiation") {
        const d = doseRate(u, v, ctx.weather) / WEATHER[ctx.weather].mult;
        const t = clamp((d - 24.5) / 4.5);
        c = [lerp(tier[0][0], tier[1][0], t), lerp(tier[0][1], tier[1][1], t), lerp(tier[0][2], tier[1][2], t)];
        a = 0.58;
      } else if (layer === "minerals") {
        const w = mineralWeights(u, v);
        const k = w.indexOf(Math.max(...w));
        c = MINERALS[k].color;
        a = 0.6;
      } else if (layer === "chemistry") {
        c = ramp(HABIT_RAMP, habitability(u, v).habit);
        a = 0.64;
      } else if (layer === "atmosphere") {
        const t = tempAt(u, v, ctx.hour);
        c = ramp(TEMP, (t + 95) / 100);
        a = 0.42 + 0.35 * (dustTau(u, v) - 0.42);
      }
      const o = (j * W + i) * 4;
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = a * 255;
    }
  }
  g.putImageData(img, 0, 0);
}

export const fmt = (n: number, d = 1) => n.toFixed(d);
export { hazD, clamp, lerp, fbm };
