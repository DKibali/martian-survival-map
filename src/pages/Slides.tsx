import { useEffect, useState } from "react";

const base = import.meta.env.BASE_URL;
const N = 7;
const slideSrc = (i: number) => `${base}slides/slide-${i}.jpg`;
export const PPTX_URL = `${base}files/slide-presentation.pptx`;
export const SLIDES_PDF_URL = `${base}files/slide-presentation.pdf`;

export default function Slides() {
  const [i, setI] = useState(1);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((v) => Math.min(N, v + 1));
      if (e.key === "ArrowLeft") setI((v) => Math.max(1, v - 1));
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 max-w-2xl">
        <div className="mb-3 text-[11px] uppercase tracking-[0.25em] text-white/45">Slide presentation</div>
        <h1 className="text-3xl font-light leading-tight tracking-tight sm:text-4xl">
          Martian Telemetry Blueprint <span className="text-orange-300">· 7 slides</span>
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          Map architecture, project evaluation (impact, creativity, validity, relevance) and the roadmap from habitat displays to suit-visor HUDs.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={PPTX_URL} download="Martian_Telemetry_Blueprint.pptx" className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-orange-200">Download PPTX</a>
          <a href={SLIDES_PDF_URL} target="_blank" rel="noreferrer" className="rounded-full border border-white/40 px-6 py-2.5 text-sm hover:bg-white/10">Open as PDF ↗</a>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <img src={slideSrc(i)} alt={`Slide ${i} of ${N}`} className="block w-full" style={{ aspectRatio: "16 / 9" }} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <button onClick={() => setI(Math.max(1, i - 1))} disabled={i === 1} className="rounded-full border border-white/30 px-5 py-2 text-sm hover:bg-white/10 disabled:opacity-30">← Prev</button>
        <span className="font-mono text-xs text-white/55">{i} / {N}</span>
        <button onClick={() => setI(Math.min(N, i + 1))} disabled={i === N} className="rounded-full border border-white/30 px-5 py-2 text-sm hover:bg-white/10 disabled:opacity-30">Next →</button>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: N }, (_, k) => k + 1).map((n) => (
          <button key={n} onClick={() => setI(n)} className={`shrink-0 overflow-hidden rounded-md border ${n === i ? "border-orange-300" : "border-white/15 opacity-60 hover:opacity-100"}`}>
            <img src={slideSrc(n)} alt={`Slide ${n}`} loading="lazy" className="block h-16 w-auto sm:h-20" />
          </button>
        ))}
      </div>
    </main>
  );
}
