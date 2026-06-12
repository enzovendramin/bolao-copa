import { requireApprovedUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Credit } from "@/components/credit";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireApprovedUser();

  return (
    <div className="min-h-dvh">
      <AppHeader userName={user.name} />
      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">
        {children}
        <Credit />
      </main>
      <BottomNav isAdmin={user.role === "ADMIN"} />
    </div>
  );
}
