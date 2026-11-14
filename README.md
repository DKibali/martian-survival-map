# Interplanetary Survival Guide: Martian Map

React + Vite + Tailwind site: interactive Jezero map (2D/3D/POV), research paper (PDF) and slide presentation (PPTX).

## Run locally
    npm install
    npm run dev

## Deploy on GitHub Pages
1. Push this folder to a GitHub repo (branch `main`).
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and publishes automatically.
   Your site appears at `https://<username>.github.io/<repo>/`.

Routing uses `#/` hash links and Vite uses a relative base (`./`), so it works from any repo name with no extra config.

## Files
- `public/files/research-paper.pdf` – research paper
- `public/files/slide-presentation.pptx` / `.pdf` – slides (download / view)
- `public/slides/slide-1..7.jpg` – slide images shown in the viewer
- `src/assets/jezero.jpg` – **base map image; replace the placeholder with your original**
