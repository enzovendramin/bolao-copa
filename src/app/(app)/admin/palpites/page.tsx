import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getActiveEdition, POOL_MATCH_FILTER } from "@/lib/queries";
import { Flag } from "@/components/flag";
import { StatusBadge } from "@/components/status-badge";
import { teamName } from "@/lib/teams";
import { formatDateTime } from "@/lib/dates";
import { matchStatus } from "@/lib/match-status";

export const dynamic = "force-dynamic";

// Visão administrativa: todos os palpites de todos os participantes,
// inclusive de jogos ainda abertos.
export default async function AdminPalpitesPage() {
  await requireAdmin();
  const edition = await getActiveEdition();
  if (!edition) return <p className="text-slate-500">Nenhuma edição ativa.</p>;

  const matches = await db.match.findMany({
    where: { editionId: edition.id, ...POOL_MATCH_FILTER },
    orderBy: { kickoff: "asc" },
    include: {
      predictions: {
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });
  const now = new Date();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">
        Visão completa de todos os palpites ({matches.reduce((s, m) => s + m.predictions.length, 0)} no total).
      </p>
      {matches.map((m) => (
        <details key={m.id} className="rounded-2xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Flag code={m.teamA} size={18} /> {teamName(m.teamA)}
              <span className="text-slate-400">×</span>
              <Flag code={m.teamB} size={18} /> {teamName(m.teamB)}
            </span>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              {m.predictions.length} palpite{m.predictions.length === 1 ? "" : "s"}
              <StatusBadge status={matchStatus(m, now)} />
            </span>
          </summary>
          <div className="border-t border-slate-100 px-4 py-2">
            <p className="py-1 text-xs text-slate-400">{m.phase} · {formatDateTime(m.kickoff)}</p>
            {m.predictions.length === 0 ? (
              <p className="py-2 text-sm text-slate-400">Nenhum palpite registrado.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {m.predictions.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-1.5">
                    <span>{p.user.name}</span>
                    <span className="flex items-center gap-3">
                      <strong>{p.scoreA} × {p.scoreB}</strong>
                      {p.points !== null && (
                        <span className="w-12 text-right text-xs text-slate-500">+{p.points} pts</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
