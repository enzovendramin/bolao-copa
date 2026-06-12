import { MatchStatus, STATUS_LABEL } from "@/lib/match-status";

const STYLES: Record<MatchStatus, string> = {
  ABERTO: "bg-emerald-100 text-emerald-700",
  FECHADO: "bg-amber-100 text-amber-700",
  FINALIZADO: "bg-slate-200 text-slate-600",
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STYLES[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
