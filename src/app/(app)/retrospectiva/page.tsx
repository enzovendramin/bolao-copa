import Link from "next/link";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition, POOL_MATCH_FILTER } from "@/lib/queries";
import { computeAwards, computeSummary, RetroUser } from "@/lib/retro";
import { scorePrediction } from "@/lib/scoring";

export const dynamic = "force-dynamic";

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

export default async function RetrospectivaPage() {
  await requireApprovedUser();
  const edition = await getActiveEdition();
  if (!edition) return <p className="text-center text-slate-500">Nenhuma edição ativa.</p>;

  const parts = await db.participation.findMany({
    where: { editionId: edition.id, user: { status: "APPROVED" } },
    include: {
      user: {
        select: {
          name: true,
          predictions: {
            where: {
              match: {
                editionId: edition.id,
                scoreA: { not: null },
                scoreB: { not: null },
                ...POOL_MATCH_FILTER,
              },
            },
            include: { match: true },
          },
        },
      },
    },
  });

  const users: RetroUser[] = parts.map((p) => ({
    name: p.user.name,
    championPick: p.championPick,
    points: p.points,
    predictions: p.user.predictions.map((pr) => {
      const r = scorePrediction(pr.scoreA, pr.scoreB, pr.match.scoreA!, pr.match.scoreB!);
      return {
        teamA: pr.match.teamA,
        teamB: pr.match.teamB,
        phase: pr.match.phase,
        scoreA: pr.scoreA,
        scoreB: pr.scoreB,
        realA: pr.match.scoreA!,
        realB: pr.match.scoreB!,
        points: r.points,
        isExact: r.isExact,
        isOutcome: r.isOutcome,
      };
    }),
  }));

  const resumo = computeSummary(users);
  const awards = computeAwards(users, edition.championTeam);

  return (
    <div className="-mt-4 flex flex-col gap-6">
      {/* Cabeçalho festivo */}
      <header className="-mx-4 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-10 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-200">
          Retrospectiva
        </p>
        <h1 className="mt-1 text-3xl font-black leading-tight">
          Copa do Mundo 2026 🏆
        </h1>
        <p className="mt-2 text-sm text-emerald-100">
          Os melhores momentos (e os furos) do bolão
        </p>
      </header>

      {/* Números do grupo */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { n: resumo.participantes, l: "participantes", e: "👥" },
          { n: resumo.totalPalpites, l: "palpites", e: "✍️" },
          { n: resumo.totalExatos, l: "placares exatos", e: "🎯" },
        ].map((s) => (
          <div
            key={s.l}
            className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 text-center"
          >
            <span className="text-xl">{s.e}</span>
            <span className="text-2xl font-black text-emerald-700">{s.n}</span>
            <span className="text-[11px] leading-tight text-slate-500">{s.l}</span>
          </div>
        ))}
      </section>

      {resumo.placarMaisComum && (
        <p className="-mt-2 text-center text-sm text-slate-500">
          O placar mais palpitado da Copa foi{" "}
          <strong className="text-slate-700">{resumo.placarMaisComum}</strong>.
        </p>
      )}

      {/* Prêmios */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">🏅 Os prêmios do bolão</h2>
        {awards.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
            Os prêmios aparecerão conforme os resultados forem saindo.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {awards.map((a, i) => (
              <div
                key={a.title}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${GRADS[i % GRADS.length]} p-4 text-white shadow-sm`}
              >
                <span className="absolute -right-3 -top-3 text-6xl opacity-25">{a.emoji}</span>
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    {a.title}
                  </p>
                  <p className="mt-1 text-xl font-black leading-tight">
                    {a.emoji} {a.winner}
                  </p>
                  <p className="mt-1 text-sm text-white/90">{a.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        href="/cerimonia"
        className="rounded-2xl bg-amber-400 px-4 py-4 text-center text-base font-bold text-amber-950 shadow-sm"
      >
        🎉 Ver a cerimônia de premiação →
      </Link>
    </div>
  );
}
