import "server-only";
import { db } from "./db";
import { scorePrediction, POINTS_CHAMPION } from "./scoring";
import { matchCountsForPool, TRACKED_CODES, OPEN_POOL_PHASES } from "./teams";

// Jogos que pontuam: com seleção do bolão OU de fase aberta (Oitavas em
// diante) — ver matchCountsForPool. Os demais são só Agenda.
const POOL_FILTER = {
  OR: [
    { teamA: { in: [...TRACKED_CODES] } },
    { teamB: { in: [...TRACKED_CODES] } },
    { phase: { in: [...OPEN_POOL_PHASES] } },
  ],
};

// Recalcula pontos de todos os palpites de um jogo finalizado.
export async function rescoreMatch(matchId: string) {
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { predictions: true },
  });
  if (!match || match.scoreA === null || match.scoreB === null) return;
  if (!matchCountsForPool(match)) return;

  for (const p of match.predictions) {
    const r = scorePrediction(p.scoreA, p.scoreB, match.scoreA, match.scoreB);
    await db.prediction.update({
      where: { id: p.id },
      data: { points: r.points, isExact: r.isExact, isOutcome: r.isOutcome },
    });
  }
}

// Recalcula totais e posições do ranking da edição.
// A posição anterior é preservada para exibir a evolução (⬆ ⬇ ➖).
// Empates: classificação por competição — mesma pontuação, mesma posição
// (ex.: 1º, 1º, 3º), sem critérios de desempate.
export async function recalcRanking(editionId: string, savePrevious = true) {
  const edition = await db.edition.findUnique({ where: { id: editionId } });
  const participations = await db.participation.findMany({
    where: { editionId, user: { status: "APPROVED" } },
    include: {
      user: {
        include: {
          predictions: {
            where: {
              match: {
                editionId,
                scoreA: { not: null },
                scoreB: { not: null },
                ...POOL_FILTER,
              },
            },
          },
        },
      },
    },
  });

  const totals = participations.map((part) => {
    const preds = part.user.predictions;
    const championBonus =
      edition?.championTeam && part.championPick === edition.championTeam
        ? POINTS_CHAMPION
        : 0;
    return {
      part,
      points: preds.reduce((s, p) => s + (p.points ?? 0), 0) + championBonus,
      exactCount: preds.filter((p) => p.isExact).length,
      outcomeCount: preds.filter((p) => p.isOutcome).length,
    };
  });

  // Ordenação com desempate: pontos → placares exatos → acertos de resultado.
  totals.sort(
    (a, b) =>
      b.points - a.points ||
      b.exactCount - a.exactCount ||
      b.outcomeCount - a.outcomeCount
  );

  // Dois participantes só dividem a posição se empatarem em TUDO (pontos,
  // exatos e acertos). Qualquer diferença nos critérios de desempate separa.
  let last: { points: number; exactCount: number; outcomeCount: number } | null = null;
  let lastPosition = 0;
  for (let i = 0; i < totals.length; i++) {
    const t = totals[i];
    const empatouTudo =
      last !== null &&
      t.points === last.points &&
      t.exactCount === last.exactCount &&
      t.outcomeCount === last.outcomeCount;
    const position = empatouTudo ? lastPosition : i + 1;
    last = { points: t.points, exactCount: t.exactCount, outcomeCount: t.outcomeCount };
    lastPosition = position;

    await db.participation.update({
      where: { id: t.part.id },
      data: {
        points: t.points,
        exactCount: t.exactCount,
        outcomeCount: t.outcomeCount,
        position,
        previousPosition: savePrevious ? t.part.position : t.part.previousPosition,
      },
    });
  }
}

// Fluxo completo ao registrar/atualizar um resultado oficial.
export async function applyResult(matchId: string, editionId: string) {
  await rescoreMatch(matchId);
  await recalcRanking(editionId);
}
