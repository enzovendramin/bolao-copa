import Link from "next/link";
import { db } from "@/lib/db";
import { getActiveEdition, getRankingRows, getChampionLock } from "@/lib/queries";
import { Podium } from "@/components/podium";
import { RankingTable } from "@/components/ranking-table";
import { Flag } from "@/components/flag";
import { teamName } from "@/lib/teams";
import { formatDate } from "@/lib/dates";
import { Credit } from "@/components/credit";

export const dynamic = "force-dynamic";

// Página pública: ranking, pódio e resultados — sem necessidade de login.
export default async function PublicPage() {
  const edition = await getActiveEdition();
  const rows = edition ? await getRankingRows(edition.id) : [];
  const picksVisible = edition ? (await getChampionLock(edition.id)).locked : false;
  const finished = edition
    ? await db.match.findMany({
        where: { editionId: edition.id, scoreA: { not: null } },
        orderBy: { kickoff: "desc" },
        take: 10,
      })
    : [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-4 pb-10">
      <header className="-mx-4 bg-emerald-700 px-4 pb-12 pt-8 text-center text-white">
        <span className="text-5xl">🏆</span>
        <h1 className="mt-2 text-2xl font-bold">Club Brésil</h1>
        <p className="text-sm text-emerald-100">
          {edition?.name ?? "Bolão da Copa do Mundo"}
        </p>
        <Link
          href="/entrar"
          className="mt-4 inline-block rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-emerald-700"
        >
          Entrar no bolão
        </Link>
      </header>

      <section className="-mt-8">
        <Podium rows={rows} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Classificação</h2>
        <RankingTable
          rows={rows}
          showChampionPicks={picksVisible}
          championTeam={edition?.championTeam}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Resultados</h2>
        {finished.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Nenhum jogo finalizado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {finished.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex flex-1 items-center justify-end gap-2">
                  <span className="text-sm font-medium">{teamName(m.teamA)}</span>
                  <Flag code={m.teamA} size={24} />
                </div>
                <span className="mx-3 rounded-lg bg-slate-100 px-3 py-1 text-base font-bold">
                  {m.scoreA} × {m.scoreB}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <Flag code={m.teamB} size={24} />
                  <span className="text-sm font-medium">{teamName(m.teamB)}</span>
                </div>
                <span className="ml-2 text-xs text-slate-400">{formatDate(m.kickoff)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <Credit />
    </main>
  );
}
