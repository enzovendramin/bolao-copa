import Link from "next/link";
import { logout } from "@/actions/auth";

export function AppHeader({ userName }: { userName?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-emerald-800/40 bg-emerald-700 text-white">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <div className="leading-tight">
            <p className="text-sm font-bold">Club Brésil</p>
            <p className="text-[11px] text-emerald-100">Bolão da Copa 2026</p>
          </div>
        </div>
        {userName && (
          <div className="flex items-center gap-1">
            <Link
              href="/senha"
              title="Alterar senha"
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-600"
            >
              🔑
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-600"
              >
                Sair
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
