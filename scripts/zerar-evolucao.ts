// Zera a evolução de posição de todos (volta a exibir ➖ até o próximo resultado).
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

db.participation
  .updateMany({ data: { previousPosition: null } })
  .then((r) => console.log(`Evolução zerada para ${r.count} participantes.`))
  .finally(() => db.$disconnect());
