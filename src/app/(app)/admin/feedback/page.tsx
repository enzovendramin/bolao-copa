import { requireAdmin } from "@/lib/auth";
import { getActiveEdition } from "@/lib/queries";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  await requireAdmin();
  const edition = await getActiveEdition();
  if (!edition) return <p className="text-slate-500">Nenhuma edição ativa.</p>;

  const feedbacks = await db.feedback.findMany({
    where: { editionId: edition.id },
    orderBy: { createdAt: "desc" },
  });
  const users = await db.user.findMany({
    where: { id: { in: feedbacks.map((f) => f.userId) } },
    select: { id: true, name: true },
  });
  const nome = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">
        {feedbacks.length} {feedbacks.length === 1 ? "resposta" : "respostas"} de feedback.
      </p>
      {feedbacks.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Nenhum feedback recebido ainda.
        </p>
      ) : (
        feedbacks.map((f) => (
          <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-semibold">{nome.get(f.userId) ?? "—"}</p>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold text-emerald-700">😍 Gostou:</span> {f.gostou}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-semibold text-amber-700">🛠️ Melhoraria:</span> {f.melhoraria}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
