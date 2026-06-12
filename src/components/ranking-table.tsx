import type { RankingRow } from "@/lib/queries";
import { teamName } from "@/lib/teams";
import { Evolution } from "./evolution";
import { Flag } from "./flag";

export function RankingTable({
  rows,
  highlightUserId,
  compact = false,
  showChampionPicks = false,
  championTeam = null,
}: {
  rows: RankingRow[];
  highlightUserId?: string;
  compact?: boolean;
  // Chutes do campeão só ficam visíveis após o início da Copa.
  showChampionPicks?: boolean;
  championTeam?: string | null;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
        Nenhum participante no ranking ainda.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2.5 text-center">#</th>
            <th className="px-2 py-2.5">Nome</th>
            <th className="px-2 py-2.5 text-center">Pts</th>
            {!compact && (
              <>
                <th className="px-2 py-2.5 text-center" title="Placares exatos">🎯</th>
                <th className="px-2 py-2.5 text-center" title="Acertos de resultado">✔</th>
              </>
            )}
            <th className="px-3 py-2.5 text-center">Evol.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.userId}
              className={`border-b border-slate-100 last:border-0 ${
                r.userId === highlightUserId ? "bg-emerald-50" : ""
              }`}
            >
              <td className="px-3 py-3 text-center font-bold text-slate-700">
                {r.position ?? "–"}º
              </td>
              <td className="px-2 py-3 font-medium">
                {r.name}
                {showChampionPicks && r.championPick && (
                  <span
                    className="ml-1.5 inline-flex items-center gap-0.5"
                    title={`Chute do campeão: ${teamName(r.championPick)}`}
                  >
                    <Flag code={r.championPick} size={16} />
                    {championTeam && r.championPick === championTeam && " 🏆"}
                  </span>
                )}
                {r.userId === highlightUserId && (
                  <span className="ml-1.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    você
                  </span>
                )}
              </td>
              <td className="px-2 py-3 text-center text-base font-bold text-emerald-700">
                {r.points}
              </td>
              {!compact && (
                <>
                  <td className="px-2 py-3 text-center text-slate-600">{r.exactCount}</td>
                  <td className="px-2 py-3 text-center text-slate-600">{r.outcomeCount}</td>
                </>
              )}
              <td className="px-3 py-3 text-center">
                <Evolution position={r.position} previousPosition={r.previousPosition} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
