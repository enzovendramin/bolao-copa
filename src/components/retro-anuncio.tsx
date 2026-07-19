"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Aviso automático da Retrospectiva: aparece ao abrir o app, para todos verem.
// Some depois que a pessoa clica (em "ver" ou "depois") — guardado no
// localStorage para não incomodar a cada navegação.
const STORAGE_KEY = "retro2026_visto";

export function RetroAnuncio() {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // não mostra nas próprias telas de encerramento
    if (pathname.startsWith("/retrospectiva") || pathname.startsWith("/cerimonia")) return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setAberto(true);
    } catch {
      setAberto(true);
    }
  }, [pathname]);

  if (!aberto) return null;

  const fechar = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setAberto(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-2xl">
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-8 text-white">
          <div className="text-5xl">🏆🎉</div>
          <h2 className="mt-3 text-2xl font-black leading-tight">
            Chegou a Retrospectiva da Copa 2026!
          </h2>
        </div>
        <div className="flex flex-col gap-3 p-6">
          <p className="text-sm text-slate-600">
            Veja os <strong>prêmios</strong>, as curiosidades e o <strong>pódio</strong> do
            bolão. Você está em qual card? 👀
          </p>
          <Link
            href="/retrospectiva"
            onClick={fechar}
            className="rounded-xl bg-emerald-700 px-4 py-3.5 text-base font-bold text-white shadow-sm"
          >
            🎉 Ver agora
          </Link>
          <button
            onClick={fechar}
            className="text-sm font-medium text-slate-400"
          >
            ver depois
          </button>
        </div>
      </div>
    </div>
  );
}
