import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logout, refreshApprovalStatus } from "@/actions/auth";

export default async function AguardandoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.status === "APPROVED") redirect("/inicio");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-6xl">⏳</span>
      <div>
        <h1 className="text-2xl font-bold">Aguardando aprovação</h1>
        <p className="mt-2 text-sm text-slate-600">
          Olá, <strong>{user.name}</strong>! Sua solicitação foi enviada ao
          administrador do bolão. Assim que for aprovada, você poderá registrar
          seus palpites.
        </p>
      </div>
      <form action={refreshApprovalStatus}>
        <button
          type="submit"
          className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Verificar novamente
        </button>
      </form>
      <form action={logout}>
        <button type="submit" className="text-sm text-slate-500 underline">
          Sair
        </button>
      </form>
    </main>
  );
}
