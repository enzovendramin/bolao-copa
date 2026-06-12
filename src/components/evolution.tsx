// Evolução da posição no ranking: ⬆ +2 / ⬇ -1 / ➖
export function Evolution({
  position,
  previousPosition,
}: {
  position: number | null;
  previousPosition: number | null;
}) {
  if (position === null || previousPosition === null) {
    return <span className="text-sm text-slate-400">➖</span>;
  }
  const delta = previousPosition - position;
  if (delta > 0) {
    return <span className="text-sm font-semibold text-emerald-600">⬆ +{delta}</span>;
  }
  if (delta < 0) {
    return <span className="text-sm font-semibold text-red-500">⬇ {delta}</span>;
  }
  return <span className="text-sm text-slate-400">➖</span>;
}
