// Migração pontual (2026-06): converte usernames herdados do formato e-mail
// para o formato novo (admin@clubbresil.com → admin, joao@teste.com → joao.teste).
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany();
  for (const u of users) {
    if (!u.username.includes("@")) continue;
    const novo =
      u.username === "admin@clubbresil.com"
        ? "admin"
        : u.username.replace("@teste.com", ".teste").replace(/[^a-z0-9._-]/g, "");
    await db.user.update({ where: { id: u.id }, data: { username: novo } });
    console.log(`${u.username} → ${novo}`);
  }
}

main().finally(() => db.$disconnect());
