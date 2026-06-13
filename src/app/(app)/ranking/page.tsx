import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition, getRankingRows, getChampionLock } from "@/lib/queries";
import { Podium } from "@/components/podium";
import { RankingTable } from "@/components/ranking-table";
import { POINTS_EXACT, POINTS_OUTCOME, POINTS_CHAMPION } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const user = await requireApprovedUser();
  const edition = await getActiveEdition();
  if (!edition) return <p className="text-center text-slate-500">Nenhuma edição ativa.</p>;

  const rows = await getRankingRows(edition.id);
  const picksVisible = (await getChampionLock(edition.id)).locked;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Ranking</h1>
        <p className="text-sm text-slate-500">{edition.name}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 pt-6">
        <Podium rows={rows} />
      </div>

      <RankingTable
        rows={rows}
        highlightUserId={user.id}
        showChampionPicks={picksVisible}
        championTeam={edition.championTeam}
      />

      <p className="text-xs text-slate-400">
        🎯 placar exato = {POINTS_EXACT} pts · ✔ acertou o resultado ={" "}
        {POINTS_OUTCOME} pts · 🏆 chute do campeão certo = {POINTS_CHAMPION} pts ·
        Empatados ocupam a mesma posição.
        {picksVisible && " A bandeira ao lado do nome é o chute do campeão."}
      </p>
    </div>
  );
}
