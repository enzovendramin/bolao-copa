// Conferência rápida: quais jogos a tela de Palpites lista hoje.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const TRACKED = ["BR", "AR", "FR", "ES", "DE", "PT"];

async function main() {
  const all = await db.match.count({ where: { kickoff: { gt: new Date() } } });
  const pool = await db.match.findMany({
    where: {
      kickoff: { gt: new Date() },
      OR: [{ teamA: { in: TRACKED } }, { teamB: { in: TRACKED } }],
    },
    orderBy: { kickoff: "asc" },
  });
  console.log("Jogos futuros no total:", all);
  console.log("Jogos futuros listados em PALPITES:", pool.length);
  console.log(pool.map((m) => `${m.teamA}x${m.teamB}`).join(", "));
}

main().finally(() => db.$disconnect());
