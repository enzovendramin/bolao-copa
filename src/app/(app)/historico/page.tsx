import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition, POOL_MATCH_FILTER } from "@/lib/queries";
import { Flag } from "@/components/flag";
import { StatusBadge } from "@/components/status-badge";
import { RetroBanner } from "@/components/retro-banner";
import { teamName } from "@/lib/teams";
import { formatDate, formatTime } from "@/lib/dates";
import { matchStatus } from "@/lib/match-status";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const user = await requireApprovedUser();
  const edition = await getActiveEdition();
  if (!edition) return <p className="text-center text-slate-500">Nenhuma edição ativa.</p>;

  const now = new Date();
  // Jogos já iniciados: palpites de todos ficam visíveis a partir daqui.
  const matches = await db.match.findMany({
    where: { editionId: edition.id, kickoff: { lte: now }, ...POOL_MATCH_FILTER },
    orderBy: { kickoff: "desc" },
    include: {
      predictions: {
        include: { user: { select: { id: true, name: true, status: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <RetroBanner />
      <div>
        <h1 className="text-xl font-bold">Histórico</h1>
        <p className="text-sm text-slate-500">
          Jogos encerrados, seus palpites e pontos obtidos.
        </p>
      </div>

      {matches.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Nenhum jogo iniciado ainda.
        </p>
      ) : (
        matches.map((m) => {
          const status = matchStatus(m, now);
          const my = m.predictions.find((p) => p.user.id === user.id);
          const others = m.predictions.filter((p) => p.user.status === "APPROVED");

          return (
            <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {m.phase} · {formatDate(m.kickoff)} às {formatTime(m.kickoff)}
                </span>
                <StatusBadge status={status} />
              </div>

              <div className="mt-3 flex items-center justify-center gap-3">
                <div className="flex flex-1 items-center justify-end gap-2">
                  <span className="text-sm font-semibold">{teamName(m.teamA)}</span>
                  <Flag code={m.teamA} size={24} />
                </div>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-lg font-bold">
                  {status === "FINALIZADO" ? `${m.scoreA} × ${m.scoreB}` : "– × –"}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <Flag code={m.teamB} size={24} />
                  <span className="text-sm font-semibold">{teamName(m.teamB)}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                {my ? (
                  <>
                    <span className="text-slate-600">
                      Seu palpite: <strong>{my.scoreA} × {my.scoreB}</strong>
                    </span>
                    {status === "FINALIZADO" ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          my.isExact
                            ? "bg-emerald-600 text-white"
                            : my.isOutcome
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {my.isExact ? "🎯 " : ""}+{my.points ?? 0} pts
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">aguardando resultado</span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400">Você não palpitou neste jogo.</span>
                )}
              </div>

              {others.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium text-emerald-700">
                    Ver palpites de todos ({others.length})
                  </summary>
                  <ul className="mt-2 divide-y divide-slate-100 text-sm">
                    {others.map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-1.5">
                        <span className={p.user.id === user.id ? "font-semibold" : ""}>
                          {p.user.name}
                        </span>
                        <span className="flex items-center gap-2">
                          <strong>{p.scoreA} × {p.scoreB}</strong>
                          {status === "FINALIZADO" && (
                            <span className="w-12 text-right text-xs text-slate-500">
                              +{p.points ?? 0} pts
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
