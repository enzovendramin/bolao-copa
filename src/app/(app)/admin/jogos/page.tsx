import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getActiveEdition } from "@/lib/queries";
import { createMatch, updateMatch, deleteMatch, setMatchPredictions } from "@/actions/admin";
import { Alerts } from "@/components/alerts";
import { StatusBadge } from "@/components/status-badge";
import { Flag } from "@/components/flag";
import { TEAMS, PHASES, teamName, isTracked, matchCountsForPool } from "@/lib/teams";
import { formatDateTime, toParisInputValue, TZ_LABEL } from "@/lib/dates";
import { matchStatus, isOpenForPredictions, PREDICTION_WINDOW_DAYS } from "@/lib/match-status";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

const field = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600";

function TeamSelect({ name, defaultValue }: { name: string; defaultValue?: string }) {
  return (
    <select name={name} required defaultValue={defaultValue ?? ""} className={field}>
      <option value="" disabled>
        Selecione…
      </option>
      <optgroup label="Seleções do bolão">
        {TEAMS.filter((t) => isTracked(t.code)).map((t) => (
          <option key={t.code} value={t.code}>
            {t.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Outras seleções">
        {TEAMS.filter((t) => !isTracked(t.code)).map((t) => (
          <option key={t.code} value={t.code}>
            {t.name}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

function MatchFields({ defaults }: { defaults?: { teamA: string; teamB: string; kickoff: Date; phase: string } }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">
          Seleção A
          <TeamSelect name="teamA" defaultValue={defaults?.teamA} />
        </label>
        <label className="text-sm font-medium">
          Seleção B
          <TeamSelect name="teamB" defaultValue={defaults?.teamB} />
        </label>
      </div>
      <label className="text-sm font-medium">
        Data e horário ({TZ_LABEL})
        <input
          type="datetime-local"
          name="kickoff"
          required
          defaultValue={defaults ? toParisInputValue(defaults.kickoff) : ""}
          className={field}
        />
      </label>
      <label className="text-sm font-medium">
        Fase
        <select name="phase" required defaultValue={defaults?.phase ?? "Fase de Grupos"} className={field}>
          {PHASES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export default async function AdminJogosPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const edition = await getActiveEdition();
  const { erro, ok } = await searchParams;
  if (!edition) return <p className="text-slate-500">Nenhuma edição ativa.</p>;

  const matches = await db.match.findMany({
    where: { editionId: edition.id },
    orderBy: { kickoff: "asc" },
  });
  const now = new Date();
  const poolMatches = matches.filter(matchCountsForPool);
  const agendaMatches = matches.filter((m) => !matchCountsForPool(m));

  return (
    <div className="flex flex-col gap-5">
      <Alerts erro={erro} ok={ok} />

      <details className="rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-emerald-700">
          ＋ Cadastrar novo jogo
        </summary>
        <form action={createMatch} className="flex flex-col gap-3 border-t border-slate-100 p-4">
          <MatchFields />
          <p className="text-xs text-slate-500">
            Jogos com Brasil, Argentina, França, Espanha, Alemanha ou Portugal
            valem palpite e pontos. Jogos sem essas seleções aparecem apenas na
            Agenda, como consulta.
          </p>
          <SubmitButton>Criar jogo</SubmitButton>
        </form>
      </details>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">Jogos do bolão ({poolMatches.length})</h2>
        <p className="-mt-1 text-xs text-slate-500">
          Valem palpite e pontos (envolvem as 6 seleções do bolão).
        </p>
        {poolMatches.map((m) => (
          <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Flag code={m.teamA} size={20} /> {teamName(m.teamA)}
                <span className="text-slate-400">×</span>
                <Flag code={m.teamB} size={20} /> {teamName(m.teamB)}
              </div>
              <StatusBadge status={matchStatus(m, now)} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {m.phase} · {formatDateTime(m.kickoff)}
              {m.scoreA !== null && (
                <span className="ml-2 font-bold text-slate-700">
                  {m.scoreA} × {m.scoreB}
                </span>
              )}
            </p>

            {matchStatus(m, now) === "ABERTO" && (
                <form
                  action={setMatchPredictions}
                  className="mt-2 flex items-center gap-2"
                >
                  <input type="hidden" name="matchId" value={m.id} />
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      isOpenForPredictions(m, now)
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isOpenForPredictions(m, now) ? "Palpites abertos" : "Palpites fechados"}
                  </span>
                  <select
                    name="mode"
                    defaultValue={m.predictionsOverride ?? "AUTO"}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-600"
                  >
                    <option value="AUTO">
                      Automático (abre {PREDICTION_WINDOW_DAYS} dias antes)
                    </option>
                    <option value="OPEN">Liberar agora</option>
                    <option value="CLOSED">Bloquear palpites</option>
                  </select>
                  <button className="shrink-0 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">
                    OK
                  </button>
                </form>
            )}

            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-emerald-700">
                Editar / excluir
              </summary>
              <form action={updateMatch} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="matchId" value={m.id} />
                <MatchFields defaults={m} />
                <SubmitButton>Salvar alterações</SubmitButton>
              </form>
              <form action={deleteMatch} className="mt-2">
                <input type="hidden" name="matchId" value={m.id} />
                <button className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                  Excluir jogo
                </button>
              </form>
            </details>
          </div>
        ))}
      </section>

      <details className="rounded-2xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 font-bold">
          Jogos só-Agenda ({agendaMatches.length})
          <span className="ml-2 text-xs font-normal text-slate-500">
            consulta — não valem palpite
          </span>
        </summary>
        <div className="flex flex-col gap-2 border-t border-slate-100 p-3">
          {agendaMatches.map((m) => (
            <div key={m.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Flag code={m.teamA} size={18} /> {teamName(m.teamA)}
                  <span className="text-slate-400">×</span>
                  <Flag code={m.teamB} size={18} /> {teamName(m.teamB)}
                </div>
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  Só Agenda
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {m.phase} · {formatDateTime(m.kickoff)}
                {m.scoreA !== null && (
                  <span className="ml-2 font-bold text-slate-700">
                    {m.scoreA} × {m.scoreB}
                  </span>
                )}
              </p>
              <details className="mt-1">
                <summary className="cursor-pointer text-xs font-medium text-emerald-700">
                  Editar / excluir
                </summary>
                <form action={updateMatch} className="mt-3 flex flex-col gap-3">
                  <input type="hidden" name="matchId" value={m.id} />
                  <MatchFields defaults={m} />
                  <SubmitButton>Salvar alterações</SubmitButton>
                </form>
                <form action={deleteMatch} className="mt-2">
                  <input type="hidden" name="matchId" value={m.id} />
                  <button className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                    Excluir jogo
                  </button>
                </form>
              </details>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
