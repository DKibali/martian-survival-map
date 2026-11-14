import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import jezero from "../assets/jezero.jpg";
import { HAB, HAZARDS, MAP, ROUTE, WAYPOINTS, elevationAt, renderLayer, type LayerId, type Weather } from "../lib/marsData";

const WW = 10;
const HH = (WW * MAP.h) / MAP.w;
const BASE = -2540;
const K = WW / MAP.metersW; // world units per metre

type Props = { layer: LayerId; weather: Weather; hour: number; showRoute: boolean; showHazards: boolean };

export default function Map3D({ layer, weather, hour, showRoute, showHazards }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const S = useRef<any>(null);
  const [exag, setExag] = useState(6);
  const [spin, setSpin] = useState(false);
  const spinRef = useRef(false);
  spinRef.current = spin;
  const exagRef = useRef(exag);
  exagRef.current = exag;

  /* mount */
  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0605);
    scene.fog = new THREE.Fog(0x0a0605, 14, 30);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 80);
    camera.position.set(0.5, 5.2, 7.2);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minDistance = 1.2;
    controls.maxDistance = 16;
    controls.target.set(0, 0, 0.3);

    scene.add(new THREE.AmbientLight(0xffe4d0, 0.85));
    const sun = new THREE.DirectionalLight(0xfff0e0, 1.5);
    sun.position.set(-6, 6, 4);
    scene.add(sun);

    const seg = [220, Math.round((220 * MAP.h) / MAP.w)];
    const geo = new THREE.PlaneGeometry(WW, HH, seg[0], seg[1]);
    geo.rotateX(-Math.PI / 2);
    const tex = new THREE.CanvasTexture(document.createElement("canvas"));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    const decor = new THREE.Group();
    const routeG = new THREE.Group();
    const hazG = new THREE.Group();
    decor.add(routeG, hazG);
    scene.add(decor);

    const img = new Image();
    img.src = jezero;
    const st = { renderer, scene, camera, controls, geo, tex, mesh, routeG, hazG, img, ready: false, draw: () => {} };
    S.current = st;

    const height = (u: number, v: number) => (elevationAt(u, v) - BASE) * K * exagRef.current;
    const worldAt = (x: number, y: number, lift = 0.03) => {
      const u = x / MAP.w, v = y / MAP.h;
      return new THREE.Vector3((u - 0.5) * WW, height(u, v) + lift, (v - 0.5) * HH);
    };
    (st as any).applyHeights = () => {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const u = p.getX(i) / WW + 0.5, v = p.getZ(i) / HH + 0.5;
        p.setY(i, height(u, v));
      }
      p.needsUpdate = true;
      geo.computeVertexNormals();
    };
    (st as any).buildDecor = () => {
      [routeG, hazG].forEach((g) => {
        g.children.slice().forEach((c) => {
          g.remove(c);
          const m = c as THREE.Mesh;
          m.geometry?.dispose();
        });
      });
      // route: densify then drape
      const pts: THREE.Vector3[] = [];
      for (let i = 1; i < ROUTE.length; i++) {
        const [x0, y0] = ROUTE[i - 1], [x1, y1] = ROUTE[i];
        const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 8));
        for (let k = 0; k < n; k++) pts.push(worldAt(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, 0.05));
      }
      pts.push(worldAt(ROUTE[ROUTE.length - 1][0], ROUTE[ROUTE.length - 1][1], 0.05));
      const curve = new THREE.CatmullRomCurve3(pts);
      routeG.add(new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 2, 0.022, 6, false), new THREE.MeshBasicMaterial({ color: 0x67e8f9 })));
      const pin = (x: number, y: number, color: number, r = 0.075) => {
        const p = worldAt(x, y, 0.05);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.32, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        stem.position.set(p.x, p.y + 0.16, p.z);
        const head = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color }));
        head.position.set(p.x, p.y + 0.34, p.z);
        routeG.add(stem, head);
      };
      pin(HAB.x, HAB.y, 0xffffff, 0.1);
      WAYPOINTS.forEach((w) => pin(w.x, w.y, 0x22d3ee));
      HAZARDS.forEach((h) => {
        const a = (h.rot * Math.PI) / 180;
        const ring: THREE.Vector3[] = [];
        for (let k = 0; k <= 48; k++) {
          const t = (k / 48) * Math.PI * 2;
          const lx = Math.cos(t) * h.rx, ly = Math.sin(t) * h.ry;
          ring.push(worldAt(h.x + lx * Math.cos(a) - ly * Math.sin(a), h.y + lx * Math.sin(a) + ly * Math.cos(a), 0.06));
        }
        hazG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), new THREE.LineBasicMaterial({ color: 0xf87171 })));
      });
    };
    (st as any).applyHeights();
    (st as any).buildDecor();

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf = 0;
    const loop = () => {
      controls.autoRotate = spinRef.current;
      controls.autoRotateSpeed = 0.8;
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    img.onload = () => {
      st.ready = true;
      st.draw();
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      geo.dispose(); mat.dispose(); tex.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      S.current = null;
    };
  }, []);

  /* texture from layer */
  useEffect(() => {
    const st = S.current;
    if (!st) return;
    st.draw = () => {
      if (!st.ready) return;
      const c = document.createElement("canvas");
      c.width = 2048; c.height = Math.round((2048 * MAP.h) / MAP.w);
      const g = c.getContext("2d")!;
      g.drawImage(st.img, 0, 0, c.width, c.height);
      if (layer !== "imagery") {
        const o = document.createElement("canvas");
        renderLayer(o, layer, { weather, hour }, 400);
        g.imageSmoothingQuality = "high";
        g.drawImage(o, 0, 0, c.width, c.height);
      }
      st.tex.image = c;
      st.tex.needsUpdate = true;
    };
    st.draw();
  }, [layer, weather, hour]);

  useEffect(() => {
    const st = S.current;
    if (!st) return;
    st.applyHeights();
    st.buildDecor();
  }, [exag]);

  useEffect(() => {
    const st = S.current;
    if (!st) return;
    st.routeG.visible = showRoute;
    st.hazG.visible = showHazards;
  }, [showRoute, showHazards]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div ref={host} className="h-[460px] w-full sm:h-[560px]" />
      <div className="absolute left-3 top-3 flex flex-wrap items-center gap-3 rounded-xl bg-black/60 px-3 py-2 text-xs text-white/80 backdrop-blur">
        <label className="flex items-center gap-2">
          Relief ×{exag}
          <input type="range" min={1} max={14} value={exag} onChange={(e) => setExag(+e.target.value)} className="w-24 accent-white" />
        </label>
        <button onClick={() => setSpin(!spin)} className={`rounded-full border px-3 py-1 ${spin ? "border-white bg-white text-black" : "border-white/30"}`}>
          {spin ? "Stop orbit" : "Auto-orbit"}
        </button>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/55 px-2 py-1 font-mono text-[10px] text-white/60">
        Drag to rotate · scroll to zoom · right-drag to pan
      </div>
    </div>
  );
}
