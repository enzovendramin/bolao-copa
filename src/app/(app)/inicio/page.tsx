import Link from "next/link";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition, getRankingRows, POOL_MATCH_FILTER } from "@/lib/queries";
import { Podium } from "@/components/podium";
import { RankingTable } from "@/components/ranking-table";
import { Flag } from "@/components/flag";
import { teamName } from "@/lib/teams";
import { formatDateTime } from "@/lib/dates";
import { isOpenForPredictions } from "@/lib/match-status";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const user = await requireApprovedUser();
  const edition = await getActiveEdition();
  if (!edition) {
    return <p className="text-center text-slate-500">Nenhuma edição ativa.</p>;
  }

  const now = new Date();
  const [nextMatch, openMatches, myPredictions, rows] = await Promise.all([
    // Próximo jogo que vale palpite (jogos só-Agenda ficam na aba Agenda)
    db.match.findFirst({
      where: { editionId: edition.id, kickoff: { gt: now }, ...POOL_MATCH_FILTER },
      orderBy: { kickoff: "asc" },
    }),
    db.match.findMany({
      where: { editionId: edition.id, kickoff: { gt: now }, ...POOL_MATCH_FILTER },
      select: { id: true, kickoff: true, scoreA: true, scoreB: true, predictionsOverride: true },
    }),
    db.prediction.findMany({ where: { userId: user.id }, select: { matchId: true } }),
    getRankingRows(edition.id),
  ]);

  const predicted = new Set(myPredictions.map((p) => p.matchId));
  const pending = openMatches.filter(
    (m) => isOpenForPredictions(m, now) && !predicted.has(m.id)
  ).length;
  const myRow = rows.find((r) => r.userId === user.id);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-slate-600">
        Olá, <strong>{user.name.split(" ")[0]}</strong>! 👋
        {myRow?.position && (
          <>
            {" "}Você está em <strong>{myRow.position}º lugar</strong> com{" "}
            <strong>{myRow.points} pontos</strong>.
          </>
        )}
      </p>

      {/* Próximo jogo */}
      {nextMatch && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Próximo jogo
          </h2>
          <div className="mt-3 flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <Flag code={nextMatch.teamA} size={36} />
              <span className="text-sm font-semibold">{teamName(nextMatch.teamA)}</span>
            </div>
            <span className="text-xl font-bold text-slate-400">×</span>
            <div className="flex flex-col items-center gap-1">
              <Flag code={nextMatch.teamB} size={36} />
              <span className="text-sm font-semibold">{teamName(nextMatch.teamB)}</span>
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">
            {nextMatch.phase} · {formatDateTime(nextMatch.kickoff)}
          </p>
        </section>
      )}

      {/* Palpites pendentes */}
      {pending > 0 ? (
        <Link
          href="/palpites"
          className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4"
        >
          <div>
            <p className="font-semibold text-amber-800">
              Você tem {pending} {pending === 1 ? "palpite pendente" : "palpites pendentes"}
            </p>
            <p className="text-sm text-amber-700">Toque para palpitar antes do início.</p>
          </div>
          <span className="text-2xl">👉</span>
        </Link>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="font-semibold text-emerald-800">✅ Todos os palpites em dia!</p>
        </div>
      )}

      {/* Pódio */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Pódio</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 pt-6">
          <Podium rows={rows} />
        </div>
      </section>

      {/* Ranking resumido */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Ranking</h2>
          <Link href="/ranking" className="text-sm font-semibold text-emerald-700">
            Ver completo →
          </Link>
        </div>
        <RankingTable rows={rows.slice(0, 5)} highlightUserId={user.id} compact />
      </section>
    </div>
  );
}
