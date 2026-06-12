// Repontua todos os jogos finalizados com a regra de pontuação atual e
// recalcula o ranking. Útil após qualquer mudança nas regras de pontos.
import { PrismaClient } from "@prisma/client";
import { scorePrediction } from "../src/lib/scoring";

const db = new PrismaClient();

async function main() {
  const finished = await db.match.findMany({
    where: { scoreA: { not: null }, scoreB: { not: null } },
    include: { predictions: true, edition: true },
  });

  for (const m of finished) {
    for (const p of m.predictions) {
      const r = scorePrediction(p.scoreA, p.scoreB, m.scoreA!, m.scoreB!);
      await db.prediction.update({ where: { id: p.id }, data: r });
    }
  }
  console.log(`${finished.length} jogo(s) finalizado(s) repontuado(s).`);

  // Recalcula totais/posições de todas as edições afetadas (sem mexer na evolução)
  const editions = await db.edition.findMany();
  for (const edition of editions) {
    const parts = await db.participation.findMany({
      where: { editionId: edition.id, user: { status: "APPROVED" } },
      include: {
        user: {
          include: {
            predictions: {
              where: { match: { editionId: edition.id, scoreA: { not: null }, scoreB: { not: null } } },
            },
          },
        },
      },
    });
    const totals = parts.map((part) => ({
      part,
      points:
        part.user.predictions.reduce((s, p) => s + (p.points ?? 0), 0) +
        (edition.championTeam && part.championPick === edition.championTeam ? 10 : 0),
      exactCount: part.user.predictions.filter((p) => p.isExact).length,
      outcomeCount: part.user.predictions.filter((p) => p.isOutcome).length,
    }));
    totals.sort((a, b) => b.points - a.points);
    let lastPoints: number | null = null;
    let lastPosition = 0;
    for (let i = 0; i < totals.length; i++) {
      const t = totals[i];
      const position = t.points === lastPoints ? lastPosition : i + 1;
      lastPoints = t.points;
      lastPosition = position;
      await db.participation.update({
        where: { id: t.part.id },
        data: {
          points: t.points,
          exactCount: t.exactCount,
          outcomeCount: t.outcomeCount,
          position,
        },
      });
    }
  }
  console.log("Ranking recalculado.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
