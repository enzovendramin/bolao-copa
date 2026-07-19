"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Confetti } from "./confetti";

type Row = { name: string; points: number };

// Revela o conteúdo quando ele entra na tela (efeito "aparece ao rolar").
function Reveal({
  children,
  onShow,
  className = "",
}: {
  children: React.ReactNode;
  onShow?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          onShow?.();
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onShow]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function Colocacao({
  rotulo,
  medal,
  row,
  tamNome,
  onShow,
}: {
  rotulo: string;
  medal: string;
  row: Row;
  tamNome: string;
  onShow?: () => void;
}) {
  return (
    <Reveal onShow={onShow} className="flex min-h-[62vh] flex-col items-center justify-center gap-2 text-center">
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

  return (
    <div className="-mt-4 flex flex-col">
      {confete && <Confetti />}

      {/* Abertura */}
      <section className="flex min-h-[64vh] flex-col items-center justify-center gap-3 text-center">
        <div className="text-6xl">🏆</div>
        <h1 className="text-3xl font-black leading-tight">
          {encerrado ? "Cerimônia de premiação" : "Pódio parcial"}
        </h1>
        <p className="text-sm text-slate-500">Club Brésil · Copa 2026</p>
        <p className="mt-8 animate-bounce text-sm font-medium text-slate-400">
          role para baixo 👇
        </p>
      </section>

      {terceiro && (
        <Colocacao rotulo="3º lugar" medal="🥉" row={terceiro} tamNome="text-2xl" />
      )}
      {segundo && (
        <Colocacao rotulo="2º lugar" medal="🥈" row={segundo} tamNome="text-3xl" />
      )}

      {/* Campeão — dispara o confete */}
      {primeiro && (
        <Reveal
          onShow={() => setConfete(true)}
          className="flex min-h-[78vh] flex-col items-center justify-center gap-2 text-center"
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600">
            {encerrado ? "🎉 Grande campeão" : "👑 Líder atual"}
          </p>
          <div className="text-7xl">🥇</div>
          <p className="text-4xl font-black leading-tight text-slate-900">{primeiro.name}</p>
          <p className="text-2xl font-black text-emerald-700">{primeiro.points} pontos</p>
        </Reveal>
      )}

      {/* Fecho */}
      <Reveal className="flex flex-col items-center gap-4 py-10 text-center">
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
