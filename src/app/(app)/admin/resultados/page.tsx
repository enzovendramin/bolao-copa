import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getActiveEdition } from "@/lib/queries";
import { saveResult, setChampion, setChampionLock } from "@/actions/admin";
import { getChampionLock } from "@/lib/queries";
import { Alerts } from "@/components/alerts";
import { Flag } from "@/components/flag";
import { TEAMS, teamName, matchCountsForPool } from "@/lib/teams";
import { formatDateTime } from "@/lib/dates";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

const scoreInput =
  "h-12 w-12 rounded-xl border-2 border-slate-300 text-center text-xl font-bold outline-none focus:border-emerald-600";

export default async function AdminResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const edition = await getActiveEdition();
  const { erro, ok } = await searchParams;
  if (!edition) return <p className="text-slate-500">Nenhuma edição ativa.</p>;
  const lock = await getChampionLock(edition.id);

  // Apenas jogos já iniciados podem receber resultado.
  const matches = await db.match.findMany({
    where: { editionId: edition.id, kickoff: { lte: new Date() } },
    orderBy: { kickoff: "desc" },
  });
  const poolMatches = matches.filter(matchCountsForPool);
  const agendaMatches = matches.filter((m) => !matchCountsForPool(m));

  return (
    <div className="flex flex-col gap-4">
      <Alerts erro={erro} ok={ok} />
      <p className="text-sm text-slate-500">
        Informe o placar do tempo regulamentar + prorrogação (pênaltis não
        contam). Ao salvar, pontuações, ranking e evolução são recalculados
        automaticamente.
      </p>

      <form
        action={setChampion}
        className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4"
      >
        <h2 className="text-sm font-bold">🏆 Seleção campeã da Copa</h2>
        <p className="mt-0.5 text-xs text-slate-600">
          Defina ao final da competição. Quem acertou o Chute do Campeão ganha
          10 pontos no ranking.
          {edition.championTeam && (
            <strong className="ml-1">
              Atual: <Flag code={edition.championTeam} size={16} /> {teamName(edition.championTeam)}
            </strong>
          )}
        </p>
        <div className="mt-2 flex gap-2">
          <select
            name="championTeam"
            defaultValue={edition.championTeam ?? ""}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
          >
            <option value="">— Ainda sem campeã —</option>
            {[...TEAMS].sort((a, b) => a.name.localeCompare(b.name, "pt")).map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
          <SubmitButton className="!py-2 px-4">Salvar</SubmitButton>
        </div>
      </form>

      <form
        action={setChampionLock}
        className="rounded-2xl border border-slate-200 bg-white p-4"
      >
        <h2 className="text-sm font-bold">
          🔒 Trava do Chute do Campeão{" "}
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              lock.locked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {lock.locked ? "Travado" : "Liberado"}
          </span>
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          No modo automático, os chutes travam quando o primeiro jogo de
          mata-mata cadastrado começar. Você pode forçar a trava ou liberar a
          qualquer momento.
        </p>
        <div className="mt-2 flex gap-2">
          <select
            name="mode"
            defaultValue={lock.mode}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
          >
            <option value="AUTO">Automático (trava no 1º jogo do mata-mata)</option>
            <option value="UNLOCKED">Forçar liberado</option>
            <option value="LOCKED">Forçar travado</option>
          </select>
          <SubmitButton className="!py-2 px-4">Aplicar</SubmitButton>
        </div>
      </form>

      <h2 className="font-bold">Jogos do bolão</h2>
      {poolMatches.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Nenhum jogo do bolão iniciado ainda.
        </p>
      ) : (
        poolMatches.map((m) => (
          <form
            key={m.id}
            action={saveResult}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <input type="hidden" name="matchId" value={m.id} />
            <p className="text-xs text-slate-500">
              {m.phase} · {formatDateTime(m.kickoff)}
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <div className="flex flex-1 items-center justify-end gap-2">
                <span className="text-sm font-semibold">{teamName(m.teamA)}</span>
                <Flag code={m.teamA} size={24} />
              </div>
              <input
                type="number"
                name="scoreA"
                min={0}
                max={30}
                required
                inputMode="numeric"
                defaultValue={m.scoreA ?? ""}
                className={scoreInput}
              />
              <span className="font-bold text-slate-400">×</span>
              <input
                type="number"
                name="scoreB"
                min={0}
                max={30}
                required
                inputMode="numeric"
                defaultValue={m.scoreB ?? ""}
                className={scoreInput}
              />
              <div className="flex flex-1 items-center gap-2">
                <Flag code={m.teamB} size={24} />
                <span className="text-sm font-semibold">{teamName(m.teamB)}</span>
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <SubmitButton className="px-6 !py-2">
                {m.scoreA !== null ? "Atualizar resultado" : "Salvar resultado oficial"}
              </SubmitButton>
            </div>
          </form>
        ))
      )}

      {agendaMatches.length > 0 && (
        <details className="rounded-2xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 font-bold">
            Jogos só-Agenda ({agendaMatches.length})
            <span className="ml-2 text-xs font-normal text-slate-500">
              placar apenas informativo — não pontua
            </span>
          </summary>
          <div className="flex flex-col gap-2 border-t border-slate-100 p-3">
            {agendaMatches.map((m) => (
              <form
                key={m.id}
                action={saveResult}
                className="rounded-xl border border-slate-200 p-3"
              >
                <input type="hidden" name="matchId" value={m.id} />
                <p className="text-xs text-slate-500">
                  {m.phase} · {formatDateTime(m.kickoff)}
                </p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <span className="text-sm font-semibold">{teamName(m.teamA)}</span>
                    <Flag code={m.teamA} size={20} />
                  </div>
                  <input
                    type="number"
                    name="scoreA"
                    min={0}
                    max={30}
                    required
                    inputMode="numeric"
                    defaultValue={m.scoreA ?? ""}
                    className={scoreInput}
                  />
                  <span className="font-bold text-slate-400">×</span>
                  <input
                    type="number"
                    name="scoreB"
                    min={0}
                    max={30}
                    required
                    inputMode="numeric"
                    defaultValue={m.scoreB ?? ""}
                    className={scoreInput}
                  />
                  <div className="flex flex-1 items-center gap-2">
                    <Flag code={m.teamB} size={20} />
                    <span className="text-sm font-semibold">{teamName(m.teamB)}</span>
                  </div>
                </div>
                <div className="mt-2 flex justify-center">
                  <SubmitButton className="px-6 !py-1.5">
                    {m.scoreA !== null ? "Atualizar placar" : "Salvar placar"}
                  </SubmitButton>
                </div>
              </form>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
