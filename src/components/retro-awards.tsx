"use client";

import type { Award } from "@/lib/retro";
import { Reveal } from "./reveal";

// Paleta de gradientes para os cards de prêmio (rotaciona).
const GRADS = [
  "from-emerald-500 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-rose-600",
  "from-cyan-500 to-blue-600",
];

function Card({ a, idx }: { a: Award; idx: number }) {
  return (
    <Reveal>
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${GRADS[idx % GRADS.length]} p-5 text-white shadow-md`}
      >
        <span className="absolute -right-3 -top-3 text-7xl opacity-20">{a.emoji}</span>
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            {a.title}
          </p>
          <p className="mt-1 text-2xl font-black leading-tight">
            {a.emoji} {a.winner}
          </p>
          <p className="mt-1 text-sm text-white/90">{a.detail}</p>
        </div>
      </div>
    </Reveal>
  );
}

// Prêmios em "páginas" de 3, com rolagem que encaixa cada página
// (scroll-snap) — dentro de um visualizador próprio.
export function RetroAwards({ awards }: { awards: Award[] }) {
  const pages: Award[][] = [];
  for (let i = 0; i < awards.length; i += 3) pages.push(awards.slice(i, i + 3));

  return (
    <div className="snap-y snap-mandatory h-[74vh] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-slate-50">
      {pages.map((page, pi) => (
        <div
          key={pi}
          className="flex h-[74vh] snap-start flex-col justify-center gap-3 px-3 py-3"
        >
          {page.map((a, i) => (
            <Card key={a.title} a={a} idx={pi * 3 + i} />
          ))}
        </div>
      ))}
    </div>
  );
}
