import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition, getRankingRows } from "@/lib/queries";
import { shortName } from "@/lib/retro";
import { CerimoniaShow } from "@/components/cerimonia-show";

export const dynamic = "force-dynamic";

export default async function CerimoniaPage() {
  await requireApprovedUser();
  const edition = await getActiveEdition();
  if (!edition) return <p className="text-center text-slate-500">Nenhuma edição ativa.</p>;

  const rows = await getRankingRows(edition.id);

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        O pódio aparecerá quando os primeiros pontos forem somados.
      </p>
    );
  }

  return (
    <CerimoniaShow rows={rows.slice(0, 3).map((r) => ({ name: shortName(r.name), points: r.points }))} />
  );
}
