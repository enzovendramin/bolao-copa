import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Edição ativa
  const edition = await db.edition.upsert({
    where: { id: "copa-2026" },
    create: { id: "copa-2026", name: "Copa do Mundo 2026", year: 2026, isActive: true },
    update: { isActive: true },
  });

  // Administrador
  const admin = await db.user.upsert({
    where: { username: "admin" },
    create: {
      name: "Enzo Vendramin",
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
      status: "APPROVED",
    },
    update: {},
  });

  await db.participation.upsert({
    where: { userId_editionId: { userId: admin.id, editionId: edition.id } },
    create: { userId: admin.id, editionId: edition.id },
    update: {},
  });

  console.log("Seed concluído.");
  console.log("Admin: usuário 'admin' / senha 'admin123' (troque a senha em produção!)");
  console.log("Tabela real da Copa: npx tsx scripts/seed-copa-2026.ts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
