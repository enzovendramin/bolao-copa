// Carrega jogos do mata-mata na edição ativa. Idempotente: não duplica
// (verifica por edição + seleção A + seleção B + fase).
//
// IMPORTANTE: roda na base apontada por DATABASE_URL/DIRECT_URL. Para o bolão
// do Brasil, defina essas variáveis para o banco do Neon-BR ANTES de rodar
// (o .env local aponta para o banco da França).
//
// Jogos sem nenhuma das 6 seleções entram só na Agenda (não valem palpite);
// isso é decidido automaticamente pelo app.
import { PrismaClient } from "@prisma/client";
import { teamName, isTracked } from "../src/lib/teams";

const db = new PrismaClient();

type Jogo = { a: string; b: string; utc: string; fase: string };

// Rodada de 32 — confrontos definidos até 27/06/2026 (horários em UTC).
const JOGOS: Jogo[] = [
  { a: "ZA", b: "CA", utc: "2026-06-28T19:00:00Z", fase: "Rodada de 32" },
  { a: "BR", b: "JP", utc: "2026-06-29T17:00:00Z", fase: "Rodada de 32" },
  { a: "DE", b: "PY", utc: "2026-06-29T20:30:00Z", fase: "Rodada de 32" },
  { a: "NL", b: "MA", utc: "2026-06-30T01:00:00Z", fase: "Rodada de 32" },
  { a: "CI", b: "NO", utc: "2026-06-30T17:00:00Z", fase: "Rodada de 32" },
  { a: "FR", b: "SE", utc: "2026-06-30T21:00:00Z", fase: "Rodada de 32" },
  { a: "AU", b: "EG", utc: "2026-07-03T18:00:00Z", fase: "Rodada de 32" },
  { a: "AR", b: "CV", utc: "2026-07-03T22:00:00Z", fase: "Rodada de 32" },
];

async function main() {
  // Trava de segurança: este carregamento é só para o bolão do Brasil.
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/?]+)/)?.[1] ?? "?";
  console.log("Banco alvo:", host);
  if (!host.includes("sa-east-1")) {
    throw new Error(
      `ABORTADO: esperado o banco do Brasil (sa-east-1), mas o alvo é "${host}". Defina DATABASE_URL/DIRECT_URL do Neon-BR antes de rodar.`
    );
  }

  const edition = await db.edition.findFirstOrThrow({ where: { isActive: true } });
  let criados = 0;
  let pulados = 0;

  for (const j of JOGOS) {
    const existe = await db.match.findFirst({
      where: { editionId: edition.id, teamA: j.a, teamB: j.b, phase: j.fase },
    });
    if (existe) {
      pulados++;
      continue;
    }
    await db.match.create({
      data: {
        editionId: edition.id,
        teamA: j.a,
        teamB: j.b,
        kickoff: new Date(j.utc),
        phase: j.fase,
      },
    });
    const tag = isTracked(j.a) || isTracked(j.b) ? "VALE PALPITE" : "só Agenda";
    console.log(`+ ${teamName(j.a)} x ${teamName(j.b)} (${tag})`);
    criados++;
  }

  console.log(`\n${criados} jogo(s) criado(s), ${pulados} já existia(m).`);
  console.log("Nenhum palpite ou pontuação existente foi alterado (operação só de inserção).");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
