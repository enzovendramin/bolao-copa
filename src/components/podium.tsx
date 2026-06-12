import type { RankingRow } from "@/lib/queries";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// Pódio estilo Kahoot: 2º à esquerda, 1º ao centro (mais alto), 3º à direita.
export function Podium({ rows }: { rows: RankingRow[] }) {
  const top3 = rows.slice(0, 3);
  if (top3.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        O pódio aparecerá quando os primeiros resultados forem lançados.
      </div>
    );
  }

  const [first, second, third] = top3;
  const slots = [
    { row: second, height: "h-24", bg: "bg-slate-200", text: "text-slate-600" },
    { row: first, height: "h-32", bg: "bg-amber-400", text: "text-amber-900" },
    { row: third, height: "h-16", bg: "bg-orange-300", text: "text-orange-900" },
  ];

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4">
      {slots.map((slot, i) =>
        slot.row ? (
          <div key={i} className="flex w-1/3 max-w-36 flex-col items-center gap-2">
            <span className="text-4xl">{MEDALS[slot.row.position ?? i + 1] ?? "🏅"}</span>
            <span className="w-full truncate text-center text-sm font-semibold">
              {slot.row.name}
            </span>
            <div
              className={`flex w-full flex-col items-center justify-start rounded-t-xl ${slot.height} ${slot.bg} pt-2`}
            >
              <span className={`text-xl font-bold ${slot.text}`}>{slot.row.points}</span>
              <span className={`text-xs ${slot.text}`}>pts</span>
            </div>
          </div>
        ) : (
          <div key={i} className="w-1/3 max-w-36" />
        )
      )}
    </div>
  );
}
