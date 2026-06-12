import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { approveUser, rejectUser, removeUser, resetPassword } from "@/actions/admin";
import { Alerts } from "@/components/alerts";

export const dynamic = "force-dynamic";

const btn = "rounded-lg px-3 py-1.5 text-xs font-semibold";

export default async function AdminParticipantesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin();
  const { ok } = await searchParams;

  const [pending, approved] = await Promise.all([
    db.user.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    db.user.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Alerts ok={ok} />

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">
          Solicitações pendentes{" "}
          {pending.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
              {pending.length}
            </span>
          )}
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500">
            Nenhuma solicitação pendente.
          </p>
        ) : (
          pending.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{u.name}</p>
                <p className="truncate text-xs text-slate-500">@{u.username}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={approveUser}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button className={`${btn} bg-emerald-600 text-white`}>Aprovar</button>
                </form>
                <form action={rejectUser}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button className={`${btn} bg-red-100 text-red-700`}>Rejeitar</button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">Participantes aprovados ({approved.length})</h2>
        {approved.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {u.name}
                {u.role === "ADMIN" && (
                  <span className="ml-1.5 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                    admin
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-slate-500">@{u.username}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <form action={resetPassword}>
                <input type="hidden" name="userId" value={u.id} />
                <button className={`${btn} bg-slate-100 text-slate-600`}>Nova senha</button>
              </form>
              {u.role !== "ADMIN" && (
                <form action={removeUser}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button className={`${btn} bg-red-100 text-red-700`}>Remover</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
