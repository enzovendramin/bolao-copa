"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/inicio", label: "Início", icon: "🏠" },
  { href: "/palpites", label: "Palpites", icon: "⚽" },
  { href: "/ranking", label: "Ranking", icon: "🏆" },
  { href: "/historico", label: "Histórico", icon: "📋" },
  { href: "/agenda", label: "Agenda", icon: "📅" },
];

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...ITEMS, { href: "/admin", label: "Admin", icon: "⚙️" }] : ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
