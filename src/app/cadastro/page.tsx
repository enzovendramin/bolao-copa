import Link from "next/link";
import { redirect } from "next/navigation";
import { register } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { Alerts } from "@/components/alerts";
import { SubmitButton } from "@/components/submit-button";

export default async function CadastroPage({
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
        <span className="text-5xl">⚽</span>
        <h1 className="mt-3 text-2xl font-bold">Criar conta</h1>
        <p className="text-sm text-slate-500">
          Após o cadastro, o administrador aprovará sua entrada no bolão.
        </p>
      </div>

      <Alerts erro={erro} />

      <form action={register} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="text-sm font-medium">
          Nome completo
          <input
            name="name"
            type="text"
            required
            minLength={3}
            autoComplete="name"
            placeholder="ex.: João Silva"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-emerald-600"
          />
          <span className="mt-0.5 block text-xs font-normal text-slate-400">
            * Preencha apenas nome + sobrenome — é assim que você aparecerá no ranking.
          </span>
        </label>
        <label className="text-sm font-medium">
          Nome de usuário
          <input
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9._\-]+"
            autoComplete="username"
            autoCapitalize="none"
            placeholder="ex.: joao"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-emerald-600"
          />
          <span className="mt-0.5 block text-xs font-normal text-slate-400">
            Sem espaços — é com ele que você vai entrar no app.
          </span>
        </label>
        <label className="text-sm font-medium">
          Senha
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-emerald-600"
          />
        </label>
        <SubmitButton className="mt-2">Criar conta</SubmitButton>
      </form>

      <p className="text-center text-sm text-slate-600">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-emerald-700">
          Entrar
        </Link>
      </p>
    </main>
  );
}
