"use client";

import { Reveal } from "./reveal";

export type DisplayCard = {
  emoji: string;
  title: string;
  headline: string;
  sub?: string;
};

// Paleta de gradientes (rotaciona).
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

function Card({ c, idx }: { c: DisplayCard; idx: number }) {
  return (
    <Reveal>
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${GRADS[idx % GRADS.length]} p-5 text-white shadow-md`}
      >
        <span className="absolute -right-3 -top-3 text-7xl opacity-20">{c.emoji}</span>
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            {c.title}
          </p>
          <p className={`mt-1 font-black leading-tight ${c.sub ? "text-2xl" : "text-lg"}`}>
            {c.headline}
          </p>
          {c.sub && <p className="mt-1 text-sm text-white/90">{c.sub}</p>}
        </div>
      </div>
    </Reveal>
  );
}

// Prêmios e curiosidades em "páginas" de 3, com rolagem que encaixa (snap).
export function RetroCards({ cards }: { cards: DisplayCard[] }) {
  const pages: DisplayCard[][] = [];
  for (let i = 0; i < cards.length; i += 3) pages.push(cards.slice(i, i + 3));

  return (
    <div className="snap-y snap-mandatory h-[74vh] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-slate-50">
      {pages.map((page, pi) => (
        <div
          key={pi}
          className="flex h-[74vh] snap-start flex-col justify-center gap-3 px-3 py-3"
        >
          {page.map((c, i) => (
            <Card key={c.title} c={c} idx={pi * 3 + i} />
          ))}
        </div>
      ))}
    </div>
  );
}
