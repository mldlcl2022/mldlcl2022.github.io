export function startEntrance() {
  const root = document.documentElement;
  const overlay = document.querySelector("#boot-screen");
  if (!root.classList.contains("booting")) {
    overlay?.remove();
    return;
  }
  const canvas = document.querySelector("#boot-rain");
  const ctx = canvas.getContext("2d");
  const pieces = [
    ...document.querySelectorAll("header, .intro > *, .visual, footer"),
  ];
  const regions = [
    document.querySelector("header"),
    document.querySelector("main"),
    document.querySelector("footer"),
  ];
  // Hide unrevealed links from keyboard and assistive tech during the short entrance.
  regions.forEach((el) => (el.inert = true));
  let width,
    height,
    columns,
    request,
    started,
    finished = false;
  const alphabet = "01アイウエオカキクケコサシスセソ<>:∑";
  function resize() {
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    columns = Array.from({ length: Math.ceil(width / 19) }, (_, i) => ({
      x: i * 19 + 8,
      delay: (Math.sin(i * 73.17) + 1) * 0.24,
      speed: 0.85 + (Math.cos(i * 11.3) + 1) * 0.24,
      tail: 16 + (i % 15),
    }));
    pieces.forEach((el) => {
      if (
        el.classList.contains("boot-piece") ||
        el.classList.contains("boot-revealed")
      )
        return;
      const top = Math.max(0, el.getBoundingClientRect().top);
      el.style.setProperty(
        "--reveal-delay",
        `${0.65 + Math.min(top / height, 1.1) * 1.35}s`,
      );
      el.classList.add("boot-piece");
      el.addEventListener("animationend", onReveal);
    });
  }
  function onReveal(event) {
    if (
      event.target !== event.currentTarget ||
      event.animationName !== "boot-materialize"
    )
      return;
    const el = event.currentTarget;
    el.classList.add("boot-revealed");
    el.classList.remove("boot-piece");
    el.removeEventListener("animationend", onReveal);
  }
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(request);
    clearTimeout(window.bootFallback);
    clearTimeout(safety);
    root.classList.remove("booting");
    regions.forEach((el) => (el.inert = false));
    pieces.forEach((el) => {
      el.classList.remove("boot-piece", "boot-revealed");
      el.style.removeProperty("--reveal-delay");
      el.removeEventListener("animationend", onReveal);
    });
    overlay.remove();
    removeEventListener("resize", resize);
  }
  function draw(now) {
    if (finished) return;
    started ??= now;
    const t = (now - started) / 1000;
    ctx.clearRect(0, 0, width, height);
    const fade = Math.max(0, Math.min(1, (3.8 - t) / 0.85));
    // The first frames are truly black. Trails then descend in staggered columns.
    ctx.font = "13px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const head = (t - 0.3 - column.delay) * (height / 1.55) * column.speed;
      for (let j = column.tail; j >= 0; j--) {
        const y = head - j * 17;
        if (y < 0 || y > height + 17) continue;
        const alpha = Math.pow(1 - j / column.tail, 1.5) * fade * 0.8;
        ctx.fillStyle =
          j === 0 ? `rgba(100,255,130,${fade})` : `rgba(0,255,65,${alpha})`;
        ctx.fillText(
          alphabet[(i * 7 + j * 3 + Math.floor(t * 13)) % alphabet.length],
          column.x,
          y,
        );
      }
    }
    if (t >= 3.8) finish();
    else request = requestAnimationFrame(draw);
  }
  const safety = setTimeout(finish, 5000);
  addEventListener("resize", resize);
  if (!ctx) {
    finish();
    return;
  }
  resize();
  request = requestAnimationFrame(draw);
}
