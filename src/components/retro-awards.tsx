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

// Mostra os prêmios um de cada vez, conforme a pessoa rola a tela.
export function RetroAwards({ awards }: { awards: Award[] }) {
  return (
    <div className="flex flex-col">
      {awards.map((a, i) => (
        <Reveal key={a.title} className="flex min-h-[48vh] items-center py-2">
          <div
            className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br ${GRADS[i % GRADS.length]} p-6 text-white shadow-lg`}
          >
            <span className="absolute -right-4 -top-4 text-8xl opacity-20">{a.emoji}</span>
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                {a.title}
              </p>
              <p className="mt-2 text-3xl font-black leading-tight">
                {a.emoji} {a.winner}
              </p>
              <p className="mt-2 text-base text-white/90">{a.detail}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
