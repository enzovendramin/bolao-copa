"use client";

import { useEffect, useRef } from "react";

// Confete leve em canvas, sem dependências. Cai por alguns segundos e para
// sozinho (não fica consumindo bateria).
export function Confetti({ durationMs = 5000 }: { durationMs?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const cores = ["#047857", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#10b981", "#f97316"];
    const W = () => window.innerWidth;
    const N = Math.min(140, Math.floor(W() / 4));
    const pecas = Array.from({ length: N }).map(() => ({
      x: Math.random() * W(),
      y: Math.random() * -window.innerHeight,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      cor: cores[(Math.random() * cores.length) | 0],
      vy: 2 + Math.random() * 3,
      vx: -1 + Math.random() * 2,
      rot: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2,
    }));

    const inicio = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const passou = t - inicio;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pecas) {
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.vr;
        if (p.y > window.innerHeight + 20) {
          p.y = -20;
          p.x = Math.random() * W();
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.cor;
        // fade nos últimos 1,2s
        ctx.globalAlpha = passou > durationMs - 1200 ? Math.max(0, (durationMs - passou) / 1200) : 1;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (passou < durationMs) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [durationMs]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
