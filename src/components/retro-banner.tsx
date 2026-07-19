import Link from "next/link";

// Banner fixo de acesso à Retrospectiva, usado no topo das abas principais.
export function RetroBanner() {
  return (
    <Link
      href="/retrospectiva"
      className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-4 text-white shadow-sm"
    >
      <div>
        <p className="font-bold">✨ Retrospectiva da Copa 2026</p>
        <p className="text-sm text-emerald-100">Prêmios, curiosidades e o pódio do bolão</p>
      </div>
      <span className="text-2xl">→</span>
    </Link>
  );
}
