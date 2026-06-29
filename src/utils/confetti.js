// A small, dependency-free confetti burst for celebration moments (clearing the
// shopping list, planning the whole week). Spawns particles on a throwaway
// full-screen canvas, animates them with rAF, then removes itself. No-op when
// the user prefers reduced motion.
export function celebrate(options = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  // A short haptic buzz on devices that support it.
  try {
    navigator.vibrate?.(30);
  } catch {
    /* ignore */
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const colors = options.colors || [
    "#5f6a3a", "#bf5840", "#cf9a45", "#4a7fa0", "#9a5680", "#4c7a33",
  ];
  const count = options.count || 130;
  const originX = (options.originX ?? 0.5) * width;
  const originY = (options.originY ?? 0.32) * height;

  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 7;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 5 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 0,
    };
  });

  const gravity = 0.16;
  const drag = 0.99;
  const maxLife = 150;
  let raf = 0;

  function frame() {
    ctx.clearRect(0, 0, width, height);
    let alive = false;

    for (const p of particles) {
      p.life += 1;
      if (p.life > maxLife) continue;
      alive = true;

      p.vy += gravity;
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      ctx.globalAlpha = Math.max(0, 1 - p.life / maxLife);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    if (alive) {
      raf = requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  raf = requestAnimationFrame(frame);

  // Safety net so the canvas never lingers.
  window.setTimeout(() => {
    cancelAnimationFrame(raf);
    canvas.remove();
  }, 4000);
}
