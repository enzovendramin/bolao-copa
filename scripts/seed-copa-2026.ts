// Carrega a tabela REAL da fase de grupos da Copa 2026 (72 jogos).
// ATENÇÃO: substitui todos os jogos cadastrados da edição ativa
// (palpites e resultados existentes são apagados junto).
//
// Rodar: npx tsx scripts/seed-copa-2026.ts
import { PrismaClient } from "@prisma/client";
import { JOGOS_FASE_GRUPOS } from "../prisma/copa2026-jogos";

const db = new PrismaClient();

async function main() {
  const edition = await db.edition.findFirstOrThrow({ where: { isActive: true } });

  const del = await db.match.deleteMany({ where: { editionId: edition.id } });
  console.log(`${del.count} jogo(s) antigo(s) removido(s) (e seus palpites).`);

  for (const j of JOGOS_FASE_GRUPOS) {
    await db.match.create({
      data: {
        editionId: edition.id,
        teamA: j.a,
        teamB: j.b,
        kickoff: new Date(j.utc),
        phase: "Fase de Grupos",
      },
    });
  }
  console.log(`${JOGOS_FASE_GRUPOS.length} jogos da fase de grupos cadastrados.`);

  // Zera estatísticas (palpites foram apagados junto com os jogos antigos)
  await db.participation.updateMany({
    data: { points: 0, exactCount: 0, outcomeCount: 0, position: 1, previousPosition: null },
  });
  console.log("Ranking zerado.");
  console.log("\nMata-mata: cadastre pelo painel admin quando os confrontos forem definidos.");
  console.log("Resultados já ocorridos: lance em /admin/resultados para a Agenda ficar completa.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
