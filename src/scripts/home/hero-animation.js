import { startEntrance } from "./entrance.js";
import { copy } from "../../data/site";
startEntrance();
let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
function updateMotion() {
  const el = document.querySelector("#motion");
  el.textContent =
    copy[document.documentElement.lang === "en" ? "en" : "ko"][
      paused ? "play" : "pause"
    ];
  el.setAttribute("aria-pressed", String(paused));
}
updateMotion();
document.addEventListener("site:language", updateMotion);
document.querySelector("#motion").addEventListener("click", () => {
  paused = !paused;
  updateMotion();
  render();
});
const canvas = document.querySelector("#matrix"),
  ctx = canvas.getContext("2d");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
reduced.addEventListener("change", (e) => {
  paused = e.matches;
  updateMotion();
  render();
});
const glyphs = "01アイウエオカキクケコサシスセソ<>:∑";
const count = innerWidth < 760 ? 1000 : 1800;
let width = 1,
  height = 1,
  time = 0,
  last = 0,
  selected = 0,
  cycleStart = 0,
  pointerX = 0,
  pointerY = 0;
const names = ["01 — NEURAL FORM", "02 — WORLD MODEL", "03 — CODE OF LIFE"];
// Deterministic point sampling keeps each character's identity during morphing.
let seed = 71;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
// Coarse, hand-drawn continent silhouettes in longitude / latitude coordinates.
const continents = [
  [
    [-168, 70],
    [-135, 72],
    [-125, 55],
    [-105, 50],
    [-82, 53],
    [-55, 48],
    [-65, 28],
    [-82, 10],
    [-100, 20],
    [-117, 33],
    [-130, 51],
  ],
  [
    [-81, 12],
    [-62, 8],
    [-35, -7],
    [-44, -24],
    [-55, -53],
    [-70, -45],
    [-76, -15],
  ],
  [
    [-18, 35],
    [10, 38],
    [35, 30],
    [51, 11],
    [36, -7],
    [30, -34],
    [17, -35],
    [5, -10],
    [-15, 7],
  ],
  [
    [-10, 36],
    [-11, 60],
    [22, 71],
    [52, 57],
    [85, 75],
    [170, 65],
    [160, 48],
    [138, 35],
    [121, 20],
    [105, 0],
    [79, 9],
    [64, 25],
    [40, 40],
    [28, 36],
  ],
  [
    [112, -11],
    [137, -11],
    [154, -25],
    [145, -39],
    [115, -34],
  ],
  [
    [-53, 60],
    [-25, 70],
    [-40, 83],
    [-60, 80],
  ],
];
function onLand(lon, lat) {
  return continents.some((poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i],
        [xj, yj] = poly[j];
      if (
        yi > lat !== yj > lat &&
        lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
      )
        inside = !inside;
    }
    return inside;
  });
}
const particles = Array.from({ length: count }, (_, i) => {
  const u = rand() * Math.PI * 2,
    v = Math.acos(2 * rand() - 1),
    s = Math.sin(v),
    x = s * Math.cos(u),
    y = Math.cos(v),
    z = s * Math.sin(u);
  const fold =
    1 + 0.09 * Math.sin(u * 12 + y * 9) + 0.055 * Math.cos(v * 19 + u * 5);
  const brain = [
    x * (0.73 + 0.16 * Math.abs(x)) * fold,
    y * 0.77 * fold + 0.08,
    z * 0.68 * fold,
  ];
  brain[0] += Math.sign(x) * 0.045;
  brain[1] -= 0.09 * Math.exp(-x * x * 55);
  const globe = [x * 0.87, y * 0.87, z * 0.87];
  const t = i / count,
    angle = t * Math.PI * 9 + (i % 2) * Math.PI;
  const rung = i % 7 === 0,
    radius = rung ? (rand() - 0.5) * 1.04 : 0.52;
  const helix = [
    Math.cos(angle) * radius,
    (t - 0.5) * 1.95,
    Math.sin(angle) * radius,
  ];
  return {
    forms: [brain, globe, helix],
    land: onLand((u * 180) / Math.PI - 180, 90 - (v * 180) / Math.PI),
    phase: rand(),
    glyph: glyphs[Math.floor(rand() * glyphs.length)],
    speed: 0.45 + rand() * 0.65,
  };
});
const streams = Array.from({ length: 48 }, () => ({
  x: rand(),
  y: rand(),
  speed: 0.035 + rand() * 0.055,
  length: 3 + Math.floor(rand() * 9),
}));
function resize() {
  const r = canvas.getBoundingClientRect();
  width = r.width;
  height = r.height;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}
function choose(index) {
  selected = index;
  cycleStart = time;
  document.querySelector("#construct").textContent = names[index];
  document
    .querySelectorAll("[data-shape]")
    .forEach((el) =>
      el.setAttribute(
        "aria-pressed",
        String(Number(el.dataset.shape) === index),
      ),
    );
  render();
}
document
  .querySelectorAll("[data-shape]")
  .forEach((el) =>
    el.addEventListener("click", () => choose(Number(el.dataset.shape))),
  );
canvas.addEventListener("pointermove", (e) => {
  const r = canvas.getBoundingClientRect();
  pointerX = (e.clientX - r.left) / r.width - 0.5;
  pointerY = (e.clientY - r.top) / r.height - 0.5;
  if (paused) render();
});
canvas.addEventListener("pointerleave", () => {
  pointerX = pointerY = 0;
  if (paused) render();
});
function render() {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  const scale = Math.min(width * 0.39, height * 0.39),
    elapsed = time - cycleStart;
  const transition = paused ? 0 : Math.max(0, Math.min(1, (elapsed - 6) / 2.2));
  const blend = transition * transition * (3 - 2 * transition),
    scatter = Math.sin(blend * Math.PI);
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  for (const stream of streams) {
    const yy = ((stream.y + time * stream.speed) % 1.5) * height;
    for (let j = 0; j < stream.length; j++) {
      ctx.fillStyle = `rgba(0,170,38,${0.035 + (1 - j / stream.length) * 0.09})`;
      ctx.fillText(
        glyphs[
          (j + Math.floor(stream.x * 100) + Math.floor(time * 2)) %
            glyphs.length
        ],
        stream.x * width,
        yy - j * 12,
      );
    }
  }
  const yaw = time * 0.17 + pointerX * 0.35,
    pitch = pointerY * 0.2;
  const points = particles
    .map((p, i) => {
      const a = p.forms[selected],
        b = p.forms[(selected + 1) % 3];
      let x = a[0] + (b[0] - a[0]) * blend,
        z = a[2] + (b[2] - a[2]) * blend,
        y = a[1] + (b[1] - a[1]) * blend;
      x += Math.sin(p.phase * 71) * scatter * 0.2;
      z += Math.cos(p.phase * 43) * scatter * 0.35;
      y += scatter * (((p.phase * 4 + time * p.speed) % 3) - 1.5);
      const xx = x * Math.cos(yaw) + z * Math.sin(yaw),
        zz = -x * Math.sin(yaw) + z * Math.cos(yaw);
      const yy = y * Math.cos(pitch) - zz * Math.sin(pitch),
        depth = y * Math.sin(pitch) + zz * Math.cos(pitch);
      const perspective = 3.6 / (3.6 - depth);
      return {
        x: width * 0.5 + xx * scale * perspective,
        y: height * 0.5 - yy * scale * perspective,
        z: depth,
        p,
        i,
      };
    })
    .sort((a, b) => a.z - b.z);
  for (const point of points) {
    const globeWeight =
      selected === 1 ? 1 - blend : (selected + 1) % 3 === 1 ? blend : 0;
    const landWeight = point.p.land ? 1 : 0.18;
    const alpha =
        Math.min(0.95, 0.18 + (point.z + 1) * 0.32) *
        (1 - globeWeight + globeWeight * landWeight),
      spark = point.p.phase > 0.977;
    ctx.fillStyle = spark
      ? `rgba(90,255,110,${alpha})`
      : `rgba(0,255,65,${alpha})`;
    ctx.font = `${point.z > 0.4 ? 10 : 8}px monospace`;
    const char = paused
      ? point.p.glyph
      : glyphs[
          (point.i + Math.floor(time * point.p.speed * 3)) % glyphs.length
        ];
    ctx.fillText(char, point.x, point.y);
  }
  // Orbital reference lines provide a quiet coordinate frame around the construct.
  ctx.strokeStyle = "rgba(0,180,42,.12)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.ellipse(
    width * 0.5,
    height * 0.5,
    scale * 1.08,
    scale * 0.28,
    -0.22,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
}
function frame(now) {
  const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
  last = now;
  if (!paused && !document.hidden) {
    time += dt;
    if (time - cycleStart >= 8.2) choose((selected + 1) % 3);
    render();
  }
  requestAnimationFrame(frame);
}
new ResizeObserver(resize).observe(canvas);
resize();
requestAnimationFrame(frame);
