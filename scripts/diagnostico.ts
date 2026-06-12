// Diagnóstico: estado do ranking e palpites por usuário.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const parts = await db.participation.findMany({ include: { user: true } });
  console.log("=== RANKING (participations) ===");
  for (const p of parts) {
    console.log(
      `${p.user.name} (@${p.user.username}): pts=${p.points} pos=${p.position} prevPos=${p.previousPosition}`
    );
  }

  console.log("\n=== PALPITES por usuário ===");
  const preds = await db.prediction.findMany({
    include: { user: true, match: true },
    orderBy: [{ match: { kickoff: "asc" } }],
  });
  const byUser = new Map<string, string[]>();
  for (const p of preds) {
    const list = byUser.get(p.user.username) ?? [];
    list.push(`${p.match.teamA}x${p.match.teamB}: ${p.scoreA}-${p.scoreB}`);
    byUser.set(p.user.username, list);
  }
  for (const [username, list] of byUser) {
    console.log(`@${username}: ${list.join(" | ")}`);
  }
}

main().finally(() => db.$disconnect());
