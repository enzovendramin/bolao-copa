import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition, getChampionLock, POOL_MATCH_FILTER } from "@/lib/queries";
import { saveAllPredictions } from "@/actions/predictions";
import { Flag } from "@/components/flag";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { Alerts } from "@/components/alerts";
import { TEAMS, teamName } from "@/lib/teams";
import { isOpenForPredictions, PREDICTION_WINDOW_DAYS } from "@/lib/match-status";
import { formatTime, formatDateTime, parisDayKey, parisDayLabel } from "@/lib/dates";

export const dynamic = "force-dynamic";

const scoreInput =
  "h-14 w-14 rounded-xl border-2 border-slate-300 text-center text-2xl font-bold outline-none focus:border-emerald-600";

export default async function PalpitesPage({
  searchParams,
}: {
  searchParams: Promise<{ salvos?: string }>;
}) {
  const user = await requireApprovedUser();
  const edition = await getActiveEdition();
  const { salvos } = await searchParams;
  if (!edition) return <p className="text-center text-slate-500">Nenhuma edição ativa.</p>;

  const now = new Date();
  const [matches, participation, lock] = await Promise.all([
    db.match.findMany({
      where: { editionId: edition.id, kickoff: { gt: now }, ...POOL_MATCH_FILTER },
      orderBy: { kickoff: "asc" },
      include: { predictions: { where: { userId: user.id } } },
    }),
    db.participation.findUnique({
      where: { userId_editionId: { userId: user.id, editionId: edition.id } },
    }),
    getChampionLock(edition.id),
  ]);
  const championLocked = lock.locked;
  const pick = participation?.championPick ?? null;

  const openMatches = matches.filter((m) => isOpenForPredictions(m, now));
  const upcoming = matches.length - openMatches.length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Meus palpites</h1>
        <p className="text-sm text-slate-500">
          Preencha os placares e salve tudo de uma vez. Os palpites de cada
          jogo abrem com {PREDICTION_WINDOW_DAYS} dias de antecedência e podem
          ser editados até o início da partida.
        </p>
      </div>

      {salvos !== undefined && (
        <Alerts
          ok={
            Number(salvos) > 0
              ? `${salvos} ${Number(salvos) === 1 ? "palpite salvo" : "palpites salvos"} com sucesso!`
              : undefined
          }
          erro={Number(salvos) === 0 ? "Nenhum palpite foi salvo. Preencha os dois placares." : undefined}
        />
      )}

      {championLocked && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-bold text-amber-900">🏆 Chute do Campeão</h2>
          {pick ? (
            <p className="mt-1 text-sm text-amber-800">
              Seu chute: <strong><Flag code={pick} size={16} /> {teamName(pick)}</strong> — vale 10
              pontos se acertar. Os chutes estão travados.
            </p>
          ) : (
            <p className="mt-1 text-sm text-amber-800">
              Os chutes estão travados e você não chegou a registrar o seu.
            </p>
          )}
        </div>
      )}

      {openMatches.length === 0 && championLocked ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Nenhum jogo aberto para palpites no momento.
        </p>
      ) : (
        <form action={saveAllPredictions} className="flex flex-col gap-3">
          {!championLocked && (
            <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-4">
              <h2 className="text-sm font-bold">🏆 Chute do Campeão — vale 10 pontos</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Quem será a campeã da Copa? Pode ser qualquer seleção.{" "}
                {lock.deadline
                  ? <>Você pode mudar até {formatDateTime(lock.deadline)} (início do mata-mata).</>
                  : <>Você pode mudar até o fim da fase de grupos.</>}
              </p>
              <select
                name="champion"
                defaultValue={pick ?? ""}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-emerald-600"
              >
                <option value="">Escolher seleção…</option>
                {[...TEAMS].sort((a, b) => a.name.localeCompare(b.name, "pt")).map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {openMatches.map((m, i) => {
            const my = m.predictions[0];
            const newDay =
              i === 0 || parisDayKey(m.kickoff) !== parisDayKey(openMatches[i - 1].kickoff);
            return (
              <div key={m.id}>
              {newDay && (
                <h3 className="mb-2 mt-2 text-sm font-bold capitalize text-slate-500">
                  {parisDayLabel(m.kickoff)}
                </h3>
              )}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {m.phase} · {formatTime(m.kickoff)}
                  </span>
                  <StatusBadge status="ABERTO" />
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="flex flex-1 flex-col items-center gap-1">
                    <Flag code={m.teamA} />
                    <span className="text-center text-xs font-semibold leading-tight">
                      {teamName(m.teamA)}
                    </span>
                  </div>
                  <input
                    type="number"
                    name={`m_${m.id}_a`}
                    min={0}
                    max={30}
                    inputMode="numeric"
                    defaultValue={my?.scoreA ?? ""}
                    className={scoreInput}
                    aria-label={`Gols de ${teamName(m.teamA)}`}
                  />
                  <span className="text-lg font-bold text-slate-400">×</span>
                  <input
                    type="number"
                    name={`m_${m.id}_b`}
                    min={0}
                    max={30}
                    inputMode="numeric"
                    defaultValue={my?.scoreB ?? ""}
                    className={scoreInput}
                    aria-label={`Gols de ${teamName(m.teamB)}`}
                  />
                  <div className="flex flex-1 flex-col items-center gap-1">
                    <Flag code={m.teamB} />
                    <span className="text-center text-xs font-semibold leading-tight">
                      {teamName(m.teamB)}
                    </span>
                  </div>
                </div>
                {my && (
                  <p className="mt-2 text-center text-[11px] text-emerald-600">
                    ✓ Palpite registrado — edite se quiser
                  </p>
                )}
              </div>
              </div>
            );
          })}

          <div className="sticky bottom-20 z-10 pt-1">
            <SubmitButton className="w-full shadow-lg">
              Salvar todos os palpites
            </SubmitButton>
          </div>

          {upcoming > 0 && (
            <p className="pb-2 text-center text-xs text-slate-400">
              Mais {upcoming} {upcoming === 1 ? "jogo abre" : "jogos abrem"} para
              palpites conforme as datas se aproximam. Veja todos na Agenda 📅.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
