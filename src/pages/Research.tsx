const base = import.meta.env.BASE_URL;
export const PAPER_URL = `${base}files/research-paper.pdf`;

export default function Research() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 max-w-2xl">
        <div className="mb-3 text-[11px] uppercase tracking-[0.25em] text-white/45">Research paper</div>
        <h1 className="text-3xl font-light leading-tight tracking-tight sm:text-4xl">
          Exploration of Jezero Crater: <span className="text-orange-300">mission, science and astrobiology</span>
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/60">
          Perseverance's four science objectives, the water history of Jezero, the Cheyava Falls potential biosignature,
          Mars Sample Return, and the spatial telemetry needed for human Marswalks.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={PAPER_URL} target="_blank" rel="noreferrer" className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-orange-200">Open PDF in new tab ↗</a>
          <a href={PAPER_URL} download="Jezero-Crater-Research-Paper.pdf" className="rounded-full border border-white/40 px-6 py-2.5 text-sm hover:bg-white/10">Download PDF</a>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <iframe
          title="Research paper (PDF)"
          src={PAPER_URL}
          className="h-[80vh] min-h-[480px] w-full bg-white"
        />
      </div>
      <p className="mt-3 text-xs text-white/40">
        If the PDF does not display in your browser (some phones can't embed PDFs), use the buttons above.
      </p>
    </main>
  );
}
