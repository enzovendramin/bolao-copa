import Link from "next/link";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition, getRankingRows, POOL_MATCH_FILTER } from "@/lib/queries";
import { Confetti } from "@/components/confetti";

export const dynamic = "force-dynamic";

export default async function CerimoniaPage() {
  await requireApprovedUser();
  const edition = await getActiveEdition();
  if (!edition) return <p className="text-center text-slate-500">Nenhuma edição ativa.</p>;

  const rows = await getRankingRows(edition.id);
  const pendentes = await db.match.count({
    where: {
      editionId: edition.id,
      scoreA: null,
      ...POOL_MATCH_FILTER,
    },
  });
  const encerrado = pendentes === 0;

  const [primeiro, segundo, terceiro] = rows;

  if (!primeiro) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        O pódio aparecerá quando os primeiros pontos forem somados.
      </p>
    );
  }

  // Slots do pódio: 2º (esq), 1º (centro, mais alto), 3º (dir)
  const slots = [
    { row: segundo, medal: "🥈", h: "h-28", bg: "from-slate-300 to-slate-400", place: "2º" },
    { row: primeiro, medal: "🥇", h: "h-40", bg: "from-amber-300 to-amber-500", place: "1º" },
    { row: terceiro, medal: "🥉", h: "h-20", bg: "from-orange-300 to-orange-400", place: "3º" },
  ];

  return (
    <div className="-mt-4 flex flex-col gap-6">
      <Confetti />

      <header className="-mx-4 bg-gradient-to-b from-emerald-700 to-emerald-800 px-6 py-8 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-200">
          {encerrado ? "Cerimônia de premiação" : "Pódio parcial"}
        </p>
        <h1 className="mt-2 text-2xl font-black">Club Brésil · Copa 2026</h1>
      </header>

      {/* Campeão em destaque */}
      <section className="-mt-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
          {encerrado ? "🎉 Grande campeão do bolão" : "👑 Líder atual"}
        </p>
        <p className="mt-1 text-4xl font-black leading-tight text-slate-900">
          {primeiro.name}
        </p>
        <p className="mt-1 text-lg font-bold text-emerald-700">
          {primeiro.points} pontos
        </p>
      </section>

      {/* Pódio */}
      <section className="flex items-end justify-center gap-2 px-2">
        {slots.map((s, i) =>
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
      </section>

      {!encerrado && (
        <p className="mx-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          ⏳ A Copa ainda não acabou — este é o pódio parcial. A cerimônia
          oficial será quando a final for lançada!
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Link
          href="/ranking"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-semibold text-emerald-700"
        >
          Ver ranking completo
        </Link>
        <Link
          href="/retrospectiva"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-semibold text-emerald-700"
        >
          ← Voltar à retrospectiva
        </Link>
      </div>
    </div>
  );
}
