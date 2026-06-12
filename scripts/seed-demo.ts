// Popula o app com dados de demonstração para testes manuais:
// - 4 participantes APROVADOS (senha: 123456) com palpites já registrados
// - 1 participante PENDENTE (para testar o fluxo de aprovação no admin)
// - 1 jogo que já começou ontem (para testar lançamento de resultado e ranking)
//
// Rodar:    npx tsx scripts/seed-demo.ts
// Desfazer: npx tsx scripts/seed-demo.ts --limpar
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_USERS = [
  { name: "João da Silva", username: "joao.teste", status: "APPROVED" },
  { name: "Maria Oliveira", username: "maria.teste", status: "APPROVED" },
  { name: "Pedro Santos", username: "pedro.teste", status: "APPROVED" },
  { name: "Ana Costa", username: "ana.teste", status: "APPROVED" },
  { name: "Carlos Pereira", username: "carlos.teste", status: "PENDING" },
];

async function limpar() {
  await db.user.deleteMany({ where: { username: { endsWith: ".teste" } } });
  console.log("Dados de demonstração removidos.");
}

async function main() {
  if (process.argv.includes("--limpar")) return limpar();

  const edition = await db.edition.findFirstOrThrow({ where: { isActive: true } });
  const passwordHash = await bcrypt.hash("123456", 10);

  // Usuários
  const users = [];
  for (const u of DEMO_USERS) {
    const user = await db.user.upsert({
      where: { username: u.username },
      create: { name: u.name, username: u.username, passwordHash, status: u.status },
      update: { status: u.status },
    });
    if (u.status === "APPROVED") {
      await db.participation.upsert({
        where: { userId_editionId: { userId: user.id, editionId: edition.id } },
        create: { userId: user.id, editionId: edition.id },
        update: {},
      });
      users.push(user);
    }
    console.log(`Usuário: ${u.username} (${u.status === "PENDING" ? "pendente — aprove no admin" : "aprovado"})`);
  }

  // Chute do Campeão dos usuários de demonstração (só se ainda não tiverem um)
  const picks = ["BR", "AR", "FR", "ES"];
  for (let i = 0; i < users.length; i++) {
    await db.participation.updateMany({
      where: { userId: users[i].id, editionId: edition.id, championPick: null },
      data: { championPick: picks[i % picks.length] },
    });
  }

  // Palpites nos jogos futuros que valem para o bolão
  const TRACKED = ["BR", "AR", "FR", "ES", "DE", "PT"];
  const futuros = await db.match.findMany({
    where: {
      editionId: edition.id,
      kickoff: { gt: new Date() },
      OR: [{ teamA: { in: TRACKED } }, { teamB: { in: TRACKED } }],
    },
  });
  for (const m of futuros) {
    for (const u of users) {
      await db.prediction.upsert({
        where: { userId_matchId: { userId: u.id, matchId: m.id } },
        create: {
          userId: u.id,
          matchId: m.id,
          scoreA: Math.floor(Math.random() * 4),
          scoreB: Math.floor(Math.random() * 3),
        },
        update: {},
      });
    }
  }

  console.log(`\nPalpites criados para ${users.length} participantes em ${futuros.length} jogos do bolão.`);
  console.log("Senha de todos os usuários de teste: 123456");
  console.log("\nRoteiro de teste sugerido:");
  console.log("1. Entre como admin e aprove carlos.teste em /admin");
  console.log("2. Quando um jogo do bolão terminar, lance o placar em /admin/resultados");
  console.log("3. Veja o ranking, o pódio e os pontos em /ranking e /historico");
  console.log("4. Entre como joao.teste / 123456 para ver a visão do participante");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
