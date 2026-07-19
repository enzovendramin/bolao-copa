"use client";

import Link from "next/link";
import { useState } from "react";
import { Confetti } from "./confetti";
import { Reveal } from "./reveal";

type Row = { name: string; points: number };

function Colocacao({
  rotulo,
  medal,
  row,
  tamNome,
}: {
  rotulo: string;
  medal: string;
  row: Row;
  tamNome: string;
}) {
  return (
    <Reveal className="flex min-h-[42vh] flex-col items-center justify-center gap-2 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{rotulo}</p>
      <div className="text-6xl">{medal}</div>
      <p className={`font-black leading-tight text-slate-900 ${tamNome}`}>{row.name}</p>
      <p className="text-lg font-bold text-emerald-700">{row.points} pontos</p>
    </Reveal>
  );
}

export function CerimoniaShow({ rows, encerrado }: { rows: Row[]; encerrado: boolean }) {
  const [confete, setConfete] = useState(false);
  const [primeiro, segundo, terceiro] = rows;

  const degraus = [
    { row: segundo, medal: "🥈", h: "h-28", bg: "from-slate-300 to-slate-400", place: "2º" },
    { row: primeiro, medal: "🥇", h: "h-44", bg: "from-amber-300 to-amber-500", place: "1º" },
    { row: terceiro, medal: "🥉", h: "h-20", bg: "from-orange-300 to-orange-400", place: "3º" },
  ];

  return (
    <div className="-mt-4 flex flex-col">
      {confete && <Confetti />}

      {/* Abertura */}
      <section className="flex min-h-[56vh] flex-col items-center justify-center gap-3 text-center">
        <div className="text-6xl">🏆</div>
        <h1 className="text-3xl font-black leading-tight">
          {encerrado ? "Cerimônia de premiação" : "Pódio parcial"}
        </h1>
        <p className="text-sm text-slate-500">Club Brésil · Copa 2026</p>
        <p className="mt-8 animate-bounce text-sm font-medium text-slate-400">
          role para baixo 👇
        </p>
      </section>

      {terceiro && <Colocacao rotulo="3º lugar" medal="🥉" row={terceiro} tamNome="text-2xl" />}
      {segundo && <Colocacao rotulo="2º lugar" medal="🥈" row={segundo} tamNome="text-3xl" />}

      {/* Campeão — dispara o confete */}
      {primeiro && (
        <Reveal
          onShow={() => setConfete(true)}
          className="flex min-h-[48vh] flex-col items-center justify-center gap-2 text-center"
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600">
            {encerrado ? "🎉 Grande campeão" : "👑 Líder atual"}
          </p>
          <div className="text-7xl">🥇</div>
          <p className="text-4xl font-black leading-tight text-slate-900">{primeiro.name}</p>
          <p className="text-2xl font-black text-emerald-700">{primeiro.points} pontos</p>
        </Reveal>
      )}

      {/* Pódio final */}
      <Reveal className="flex min-h-[46vh] flex-col items-center justify-center gap-5 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">O pódio</p>
        <div className="flex w-full items-end justify-center gap-2 px-2">
          {degraus.map((s, i) =>
            s.row ? (
              <div key={i} className="flex w-1/3 max-w-[120px] flex-col items-center gap-1">
                <span className="text-4xl">{s.medal}</span>
                <span className="w-full truncate text-center text-sm font-bold">{s.row.name}</span>
                <div
                  className={`flex w-full flex-col items-center justify-start rounded-t-xl bg-gradient-to-b ${s.h} ${s.bg} pt-2 shadow-inner`}
                >
                  <span className="text-2xl font-black text-white drop-shadow">{s.place}</span>
                  <span className="mt-0.5 text-sm font-bold text-white/90">{s.row.points} pts</span>
                </div>
              </div>
            ) : (
              <div key={i} className="w-1/3 max-w-[120px]" />
            )
          )}
        </div>
      </Reveal>

      {/* Fecho */}
      <Reveal className="flex flex-col items-center gap-4 pb-8 pt-2 text-center">
        {!encerrado && (
          <p className="mx-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⏳ A Copa ainda não acabou — este é o pódio parcial. A cerimônia
            oficial será quando a final for lançada!
          </p>
        )}
        <div className="flex w-full flex-col gap-2">
          <Link
            href="/ranking"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-emerald-700"
          >
            Ver ranking completo
          </Link>
          <Link
            href="/retrospectiva"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-emerald-700"
          >
            ← Voltar à retrospectiva
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
