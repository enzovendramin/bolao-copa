import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition } from "@/lib/queries";
import { db } from "@/lib/db";
import { saveFeedback } from "@/actions/feedback";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

const campo =
  "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-emerald-600";

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const user = await requireApprovedUser();
  const edition = await getActiveEdition();
  const { enviado } = await searchParams;

  const existente = edition
    ? await db.feedback.findUnique({
        where: { userId_editionId: { userId: user.id, editionId: edition.id } },
      })
    : null;

  return (
    <div className="-mt-4 flex flex-col gap-5">
      <header className="-mx-4 bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-8 text-center text-white">
        <div className="text-4xl">💬</div>
        <h1 className="mt-2 text-2xl font-black">Deixe seu feedback</h1>
        <p className="mt-1 text-sm text-emerald-100">
          Rapidinho — duas perguntas para o bolão ficar ainda melhor.
        </p>
      </header>

      {enviado && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
          ✅ Obrigado! Seu feedback foi enviado. Pode editar quando quiser.
        </div>
      )}

      <form action={saveFeedback} className="flex flex-col gap-4">
        <label className="text-sm font-semibold">
          😍 O que você mais gostou?
          <textarea
            name="gostou"
            rows={3}
            maxLength={1000}
            required
            defaultValue={existente?.gostou ?? ""}
            placeholder="Escreva em uma frase…"
            className={campo}
          />
        </label>
        <label className="text-sm font-semibold">
          🛠️ O que você melhoraria?
          <textarea
            name="melhoraria"
            rows={3}
            maxLength={1000}
            required
            defaultValue={existente?.melhoraria ?? ""}
            placeholder="Escreva em uma frase…"
            className={campo}
          />
        </label>
        <SubmitButton>{existente ? "Atualizar feedback" : "Enviar feedback"}</SubmitButton>
      </form>
    </div>
  );
}
