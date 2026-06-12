export function Alerts({ erro, ok }: { erro?: string; ok?: string }) {
  if (!erro && !ok) return null;
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${
        erro
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {erro ?? ok}
    </div>
  );
}
