import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition } from "@/lib/queries";
import { Flag } from "@/components/flag";
import { teamName, isTracked } from "@/lib/teams";
import { formatTime, parisDayKey as dayKey, parisDayLabel as dayLabel, TZ_LABEL } from "@/lib/dates";
import { matchStatus } from "@/lib/match-status";

export const dynamic = "force-dynamic";

// Agenda de consulta: todos os jogos cadastrados, agrupados por dia —
// inclusive os que não valem palpite (sem seleções do bolão).
export default async function AgendaPage() {
  await requireApprovedUser();
  const edition = await getActiveEdition();
  if (!edition) return <p className="text-center text-slate-500">Nenhuma edição ativa.</p>;

  // Janela de exibição: de ontem até 7 dias à frente (consulta leve).
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + 8);
  end.setHours(0, 0, 0, 0);

  const matches = await db.match.findMany({
    where: { editionId: edition.id, kickoff: { gte: start, lt: end } },
    orderBy: { kickoff: "asc" },
  });
  const todayKey = dayKey(now);
  const days = new Map<string, typeof matches>();
  for (const m of matches) {
    const key = dayKey(m.kickoff);
    days.set(key, [...(days.get(key) ?? []), m]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Agenda de jogos</h1>
        <p className="text-sm text-slate-500">
          Jogos de ontem a 7 dias à frente. Os marcados com ⚽ valem palpite no
          bolão.
        </p>
      </div>

      {days.size === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Nenhum jogo cadastrado para os próximos dias.
        </p>
      ) : (
        [...days.entries()].map(([key, dayMatches]) => {
          const isToday = key === todayKey;
          return (
            <section key={key} className="flex flex-col gap-2">
              <h2
                className={`text-sm font-bold capitalize ${
                  isToday ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {isToday && "📍 Hoje · "}
                {dayLabel(dayMatches[0].kickoff)}
              </h2>
              {dayMatches.map((m) => {
                const status = matchStatus(m, now);
                const pool = isTracked(m.teamA) || isTracked(m.teamB);
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 ${
                      isToday ? "border-emerald-200" : "border-slate-200"
                    }`}
                  >
                    <span className="w-12 shrink-0 text-sm font-semibold text-slate-600">
                      {formatTime(m.kickoff)}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                      <span className="truncate text-sm font-medium">{teamName(m.teamA)}</span>
                      <Flag code={m.teamA} size={20} />
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold">
                        {status === "FINALIZADO" ? `${m.scoreA}×${m.scoreB}` : "×"}
                      </span>
                      <Flag code={m.teamB} size={20} />
                      <span className="truncate text-sm font-medium">{teamName(m.teamB)}</span>
                    </div>
                    <span className="w-5 shrink-0 text-center" title={pool ? "Vale palpite no bolão" : "Apenas consulta"}>
                      {pool ? "⚽" : ""}
                    </span>
                  </div>
                );
              })}
            </section>
          );
        })
      )}

      <p className="text-xs text-slate-400">
        Exibindo no {TZ_LABEL}. {`"×"`} sem placar = jogo ainda não finalizado.
      </p>
    </div>
  );
}
