import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const TABS = [
  { href: "/admin", label: "Participantes" },
  { href: "/admin/jogos", label: "Jogos" },
  { href: "/admin/resultados", label: "Resultados" },
  { href: "/admin/palpites", label: "Palpites" },
  { href: "/admin/feedback", label: "Feedback" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Painel administrativo</h1>
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
