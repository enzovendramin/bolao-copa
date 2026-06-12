// Teste de integração da lógica de pontuação/ranking (roda e desfaz tudo).
import { PrismaClient } from "@prisma/client";
import { scorePrediction } from "../src/lib/scoring";

const db = new PrismaClient();

async function recalc(editionId: string, savePrevious = true) {
  // réplica do recalcRanking (que usa server-only e não importa aqui)
  const edition = await db.edition.findUnique({ where: { id: editionId } });
  const participations = await db.participation.findMany({
    where: { editionId, user: { status: "APPROVED" } },
    include: {
      user: {
        include: {
          predictions: {
            where: { match: { editionId, scoreA: { not: null }, scoreB: { not: null } } },
          },
        },
      },
    },
  });
  const totals = participations.map((part) => ({
    part,
    points:
      part.user.predictions.reduce((s, p) => s + (p.points ?? 0), 0) +
      (edition?.championTeam && part.championPick === edition.championTeam ? 10 : 0),
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
        previousPosition: savePrevious ? t.part.position : t.part.previousPosition,
      },
    });
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("FALHOU: " + msg);
  console.log("OK:", msg);
}

async function main() {
  // 1. Regras de pontuação puras
  assert(scorePrediction(2, 1, 2, 1).points === 5, "placar exato = 5 pts");
  assert(scorePrediction(3, 1, 2, 1).points === 2, "resultado certo, placar errado = 2 pts");
  assert(scorePrediction(1, 1, 2, 2).points === 2, "empate com placar diferente = 2 pts");
  assert(scorePrediction(0, 1, 2, 1).points === 0, "resultado errado = 0 pts");
  assert(scorePrediction(1, 1, 1, 1).points === 5, "empate exato = 5 pts");

  // 2. Fluxo completo: usuários, palpites, resultado, ranking, empate, evolução
  const edition = await db.edition.findFirstOrThrow({ where: { isActive: true } });

  // Limpeza preventiva de execuções anteriores interrompidas
  // (script de desenvolvimento — não rodar em produção)
  await db.user.deleteMany({ where: { username: { in: ["t-joao", "t-pedro", "t-lucas"] } } });
  await db.match.deleteMany({
    where: { OR: [{ teamA: "BR", teamB: "FR" }, { teamA: "AR", teamB: "DE" }] },
  });
  await db.edition.update({ where: { id: edition.id }, data: { championTeam: null } });
  const mk = async (n: string) =>
    db.user.create({
      data: { name: n, username: n, passwordHash: "x", status: "APPROVED" },
    });
  const [u1, u2, u3] = await Promise.all([mk("t-joao"), mk("t-pedro"), mk("t-lucas")]);
  for (const u of [u1, u2, u3]) {
    await db.participation.create({ data: { userId: u.id, editionId: edition.id } });
  }

  const match = await db.match.create({
    data: {
      editionId: edition.id, teamA: "BR", teamB: "FR",
      kickoff: new Date(Date.now() - 3600_000), phase: "Fase de Grupos",
    },
  });
  await db.prediction.create({ data: { userId: u1.id, matchId: match.id, scoreA: 2, scoreB: 1 } });
  await db.prediction.create({ data: { userId: u2.id, matchId: match.id, scoreA: 3, scoreB: 1 } });
  await db.prediction.create({ data: { userId: u3.id, matchId: match.id, scoreA: 0, scoreB: 2 } });

  // resultado oficial: BR 2x1 FR
  await db.match.update({ where: { id: match.id }, data: { scoreA: 2, scoreB: 1 } });
  for (const p of await db.prediction.findMany({ where: { matchId: match.id } })) {
    const r = scorePrediction(p.scoreA, p.scoreB, 2, 1);
    await db.prediction.update({ where: { id: p.id }, data: r });
  }
  await recalc(edition.id);

  const rows = await db.participation.findMany({
    where: { editionId: edition.id, userId: { in: [u1.id, u2.id, u3.id] } },
    include: { user: true },
  });
  const get = (id: string) => rows.find((r) => r.userId === id)!;
  assert(get(u1.id).points === 5 && get(u1.id).exactCount === 1, "João: 5 pts, 1 exato");
  assert(get(u2.id).points === 2 && get(u2.id).outcomeCount === 1, "Pedro: 2 pts, 1 acerto");
  assert(get(u3.id).points === 0, "Lucas: 0 pts");
  assert(get(u1.id).position === 1, "João em 1º");

  // 3. Empate de posições: segundo jogo, Lucas acerta placar exato e passa Pedro
  const match2 = await db.match.create({
    data: {
      editionId: edition.id, teamA: "AR", teamB: "DE",
      kickoff: new Date(Date.now() - 3600_000), phase: "Fase de Grupos",
    },
  });
  await db.prediction.create({ data: { userId: u3.id, matchId: match2.id, scoreA: 1, scoreB: 1 } });
  await db.prediction.create({ data: { userId: u2.id, matchId: match2.id, scoreA: 2, scoreB: 0 } });
  await db.match.update({ where: { id: match2.id }, data: { scoreA: 1, scoreB: 1 } });
  for (const p of await db.prediction.findMany({ where: { matchId: match2.id } })) {
    const r = scorePrediction(p.scoreA, p.scoreB, 1, 1);
    await db.prediction.update({ where: { id: p.id }, data: r });
  }
  await recalc(edition.id);

  const rows2 = await db.participation.findMany({
    where: { editionId: edition.id, userId: { in: [u1.id, u2.id, u3.id] } },
  });
  const get2 = (id: string) => rows2.find((r) => r.userId === id)!;
  assert(get2(u1.id).points === 5 && get2(u3.id).points === 5, "João e Lucas com 5 pts");
  assert(get2(u1.id).position === 1 && get2(u3.id).position === 1, "empate: ambos em 1º");
  assert(get2(u2.id).position === 3, "Pedro pula para 3º (sem 2º lugar)");
  assert(get2(u3.id).previousPosition === 3, "evolução de Lucas: era 3º (⬆ +2)");

  // 4. Chute do Campeão: João apostou no Brasil, Brasil campeão → +10 pts
  await db.participation.update({
    where: { userId_editionId: { userId: u1.id, editionId: edition.id } },
    data: { championPick: "BR" },
  });
  await db.edition.update({ where: { id: edition.id }, data: { championTeam: "BR" } });
  await recalc(edition.id);
  const rows3 = await db.participation.findMany({
    where: { editionId: edition.id, userId: { in: [u1.id, u3.id] } },
  });
  const get3 = (id: string) => rows3.find((r) => r.userId === id)!;
  assert(get3(u1.id).points === 15, "João: 5 + 10 do campeão = 15 pts");
  // comparação relativa: outros participantes reais podem existir no banco
  assert(
    (get3(u1.id).position ?? 99) < (get3(u3.id).position ?? 0),
    "João desempata à frente de Lucas"
  );
  await db.edition.update({ where: { id: edition.id }, data: { championTeam: null } });

  // limpeza — zera também a evolução, pois os usuários temporários
  // alteraram posições reais durante o teste
  await db.match.delete({ where: { id: match.id } });
  await db.match.delete({ where: { id: match2.id } });
  for (const u of [u1, u2, u3]) await db.user.delete({ where: { id: u.id } });
  await db.participation.updateMany({
    where: { editionId: edition.id },
    data: { previousPosition: null },
  });
  await recalc(edition.id, false);

  console.log("\nTodos os testes passaram. Dados de teste removidos.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
