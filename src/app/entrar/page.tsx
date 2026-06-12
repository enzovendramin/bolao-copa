import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { Alerts } from "@/components/alerts";
import { SubmitButton } from "@/components/submit-button";
import { Credit } from "@/components/credit";

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.status === "APPROVED" ? "/inicio" : "/aguardando");
  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <span className="text-5xl">🏆</span>
        <h1 className="mt-3 text-2xl font-bold">Club Brésil</h1>
        <p className="text-sm text-slate-500">Bolão da Copa do Mundo 2026</p>
      </div>

      <Alerts erro={erro} />

      <form action={login} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="text-sm font-medium">
          Nome de usuário
          <input
            name="username"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-emerald-600"
          />
        </label>
        <label className="text-sm font-medium">
          Senha
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-emerald-600"
          />
        </label>
        <SubmitButton className="mt-2">Entrar</SubmitButton>
      </form>

      <p className="text-center text-sm text-slate-600">
        Ainda não participa?{" "}
        <Link href="/cadastro" className="font-semibold text-emerald-700">
          Criar conta
        </Link>
      </p>
      <p className="text-center text-sm">
        <Link href="/" className="text-slate-500 underline">
          Ver classificação pública
        </Link>
      </p>

      <Credit />
    </main>
  );
}
