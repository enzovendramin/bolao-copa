import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition, getRankingRows, POOL_MATCH_FILTER } from "@/lib/queries";
import { CerimoniaShow } from "@/components/cerimonia-show";

export const dynamic = "force-dynamic";

export default async function CerimoniaPage() {
  await requireApprovedUser();
  const edition = await getActiveEdition();
  if (!edition) return <p className="text-center text-slate-500">Nenhuma edição ativa.</p>;

  const rows = await getRankingRows(edition.id);
  const pendentes = await db.match.count({
    where: { editionId: edition.id, scoreA: null, ...POOL_MATCH_FILTER },
  });
  const encerrado = pendentes === 0;

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        O pódio aparecerá quando os primeiros pontos forem somados.
      </p>
    );
  }

  return (
    <CerimoniaShow
      rows={rows.slice(0, 3).map((r) => ({ name: r.name, points: r.points }))}
      encerrado={encerrado}
    />
  );
}
