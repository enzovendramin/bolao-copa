import { requireApprovedUser } from "@/lib/auth";
import { changePassword } from "@/actions/auth";
import { Alerts } from "@/components/alerts";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

const field =
  "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-emerald-600";

export default async function SenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireApprovedUser();
  const { erro, ok } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Alterar senha</h1>
        <p className="text-sm text-slate-500">
          Escolha uma senha que só você saiba.
        </p>
      </div>

      <Alerts erro={erro} ok={ok} />

      <form
        action={changePassword}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <label className="text-sm font-medium">
          Senha atual
          <input name="current" type="password" required autoComplete="current-password" className={field} />
        </label>
        <label className="text-sm font-medium">
          Nova senha
          <input name="new" type="password" required minLength={6} autoComplete="new-password" className={field} />
        </label>
        <SubmitButton className="mt-2">Salvar nova senha</SubmitButton>
      </form>
    </div>
  );
}
