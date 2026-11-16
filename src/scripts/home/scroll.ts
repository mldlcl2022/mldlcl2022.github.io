const root = document.documentElement;
const header = document.querySelector<HTMLElement>("header");
const footer = document.querySelector<HTMLElement>("footer");
const screens = [...document.querySelectorAll<HTMLElement>("[data-screen]")];
const desktop = matchMedia("(min-width: 761px) and (hover: hover)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

// Measure wrapped mobile navigation and the footer instead of assuming fixed heights.
const measure = () => {
  root.style.setProperty(
    "--home-header-height",
    `${header?.offsetHeight ?? 50}px`,
  );
  root.style.setProperty(
    "--home-footer-height",
    `${footer?.offsetHeight ?? 72}px`,
  );
};
const observer = new ResizeObserver(measure);
if (header) observer.observe(header);
if (footer) observer.observe(footer);
measure();

const stops = () => {
  const height = innerHeight - (header?.offsetHeight ?? 50);
  const max = Math.max(0, root.scrollHeight - innerHeight);
  const points = [0, max];
  for (const screen of screens) {
    const top = Math.max(
      0,
      screen.getBoundingClientRect().top +
        scrollY -
        (header?.offsetHeight ?? 50),
    );
    points.push(Math.min(max, top));
    // Short browser windows can still scroll through all of a tall section.
    for (
      let y = top + height;
      y < top + screen.offsetHeight - height;
      y += height
    ) {
      points.push(Math.min(max, y));
    }
  }
  return [...new Set(points.map(Math.round))].sort((a, b) => a - b);
};
let lockedUntil = 0;
let accumulated = 0;
let lastWheel = 0;
const jump = (target: number) => {
  if (Math.abs(scrollY - target) < 2) return;
  lockedUntil = performance.now() + (reducedMotion.matches ? 180 : 850);
  scrollTo({
    top: target,
    behavior: reducedMotion.matches ? "instant" : "smooth",
  });
};
const step = (direction: number) => {
  const points = stops();
  const target =
    direction > 0
      ? (points.find((y) => y > scrollY + 3) ?? points[points.length - 1])
      : ([...points].reverse().find((y) => y < scrollY - 3) ?? 0);
  jump(target);
};
const freeScrollTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  !!target.closest(
    'dialog, [data-free-scroll], input, textarea, select, [contenteditable="true"]',
  );

addEventListener(
  "wheel",
  (event: WheelEvent) => {
    if (
      !desktop.matches ||
      event.ctrlKey ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
      freeScrollTarget(event.target) ||
      root.classList.contains("booting")
    )
      return;
    event.preventDefault();
    const now = performance.now();
    if (now < lockedUntil) {
      lastWheel = now;
      accumulated = 0;
      return;
    }
    const delta =
      event.deltaY *
      (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (now - lastWheel > 180 || Math.sign(accumulated) !== Math.sign(delta))
      accumulated = 0;
    lastWheel = now;
    accumulated += delta;
    if (Math.abs(accumulated) >= 36) {
      step(Math.sign(accumulated));
      accumulated = 0;
    }
  },
  { passive: false },
);

addEventListener("keydown", (event: KeyboardEvent) => {
  if (
    !desktop.matches ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    freeScrollTarget(event.target) ||
    root.classList.contains("booting")
  )
    return;
  if (
    event.target instanceof Element &&
    event.target.closest("button,a,summary")
  )
    return;
  const down =
    ["ArrowDown", "PageDown"].includes(event.key) ||
    (event.key === " " && !event.shiftKey);
  const up =
    ["ArrowUp", "PageUp"].includes(event.key) ||
    (event.key === " " && event.shiftKey);
  if (!down && !up && !["Home", "End"].includes(event.key)) return;
  event.preventDefault();
  if (performance.now() < lockedUntil) return;
  if (event.key === "Home") jump(0);
  else if (event.key === "End") jump(root.scrollHeight - innerHeight);
  else step(down ? 1 : -1);
});
