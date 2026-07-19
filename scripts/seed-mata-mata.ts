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
import { teamName, matchCountsForPool } from "../src/lib/teams";

const db = new PrismaClient();

type Jogo = { a: string; b: string; utc: string; fase: string };

// Rodada de 32 completa — 16 confrontos definidos em 28/06/2026 (horários em
// UTC). O script é idempotente: os 8 já carregados antes são pulados.
const JOGOS: Jogo[] = [
  { a: "ZA", b: "CA", utc: "2026-06-28T19:00:00Z", fase: "Rodada de 32" },
  { a: "BR", b: "JP", utc: "2026-06-29T17:00:00Z", fase: "Rodada de 32" },
  { a: "DE", b: "PY", utc: "2026-06-29T20:30:00Z", fase: "Rodada de 32" },
  { a: "NL", b: "MA", utc: "2026-06-30T01:00:00Z", fase: "Rodada de 32" },
  { a: "CI", b: "NO", utc: "2026-06-30T17:00:00Z", fase: "Rodada de 32" },
  { a: "FR", b: "SE", utc: "2026-06-30T21:00:00Z", fase: "Rodada de 32" },
  { a: "MX", b: "EC", utc: "2026-07-01T01:00:00Z", fase: "Rodada de 32" },
  { a: "ENG", b: "CD", utc: "2026-07-01T16:00:00Z", fase: "Rodada de 32" },
  { a: "BE", b: "SN", utc: "2026-07-01T20:00:00Z", fase: "Rodada de 32" },
  { a: "US", b: "BA", utc: "2026-07-02T00:00:00Z", fase: "Rodada de 32" },
  { a: "ES", b: "AT", utc: "2026-07-02T19:00:00Z", fase: "Rodada de 32" },
  { a: "PT", b: "HR", utc: "2026-07-02T23:00:00Z", fase: "Rodada de 32" },
  { a: "CH", b: "DZ", utc: "2026-07-03T03:00:00Z", fase: "Rodada de 32" },
  { a: "AU", b: "EG", utc: "2026-07-03T18:00:00Z", fase: "Rodada de 32" },
  { a: "AR", b: "CV", utc: "2026-07-03T22:00:00Z", fase: "Rodada de 32" },
  { a: "CO", b: "GH", utc: "2026-07-04T01:30:00Z", fase: "Rodada de 32" },

  // Oitavas de Final — 8 confrontos (horários em UTC).
  { a: "CA", b: "MA", utc: "2026-07-04T17:00:00Z", fase: "Oitavas de Final" },
  { a: "PY", b: "FR", utc: "2026-07-04T21:00:00Z", fase: "Oitavas de Final" },
  { a: "BR", b: "NO", utc: "2026-07-05T20:00:00Z", fase: "Oitavas de Final" },
  { a: "MX", b: "ENG", utc: "2026-07-06T00:00:00Z", fase: "Oitavas de Final" },
  { a: "PT", b: "ES", utc: "2026-07-06T19:00:00Z", fase: "Oitavas de Final" },
  { a: "US", b: "BE", utc: "2026-07-07T00:00:00Z", fase: "Oitavas de Final" },
  { a: "AR", b: "EG", utc: "2026-07-07T16:00:00Z", fase: "Oitavas de Final" },
  { a: "CH", b: "CO", utc: "2026-07-07T20:00:00Z", fase: "Oitavas de Final" },

  // Quartas de Final — 4 confrontos (horários em UTC).
  { a: "FR", b: "MA", utc: "2026-07-09T20:00:00Z", fase: "Quartas de Final" },
  { a: "ES", b: "BE", utc: "2026-07-10T19:00:00Z", fase: "Quartas de Final" },
  { a: "NO", b: "ENG", utc: "2026-07-11T21:00:00Z", fase: "Quartas de Final" },
  { a: "AR", b: "CH", utc: "2026-07-12T01:00:00Z", fase: "Quartas de Final" },

  // Semifinal — 2 confrontos (horários em UTC).
  { a: "FR", b: "ES", utc: "2026-07-14T19:00:00Z", fase: "Semifinal" },
  { a: "ENG", b: "AR", utc: "2026-07-15T19:00:00Z", fase: "Semifinal" },

  // Decisões — chave completa (horários em UTC).
  { a: "FR", b: "ENG", utc: "2026-07-18T21:00:00Z", fase: "Disputa de 3º Lugar" },
  { a: "ES", b: "AR", utc: "2026-07-19T19:00:00Z", fase: "Final" },
];

async function main() {
  // Trava de segurança: exige confirmar explicitamente a região do banco alvo
  // (sa-east-1 = Brasil, eu-central-1 = França), evitando atingir o banco
  // errado por acidente.
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/?]+)/)?.[1] ?? "?";
  const expected = process.env.EXPECTED_REGION;
  console.log("Banco alvo:", host);
  if (!expected) {
    throw new Error(
      "ABORTADO: defina EXPECTED_REGION (ex.: sa-east-1 para Brasil, eu-central-1 para França) para confirmar o banco alvo."
    );
  }
  if (!host.includes(expected)) {
    throw new Error(
      `ABORTADO: esperado a região "${expected}", mas o banco alvo é "${host}".`
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
    // Reflete a regra real do bolão-alvo. Para etiquetas corretas, defina
    // OPEN_FROM_PHASE igual ao do bolão (ex.: "Quartas de Final" no Brasil).
    const tag = matchCountsForPool({ teamA: j.a, teamB: j.b, phase: j.fase })
      ? "VALE PALPITE"
      : "só Agenda";
    console.log(`+ ${teamName(j.a)} x ${teamName(j.b)} (${tag})`);
    criados++;
  }

  console.log(`\n${criados} jogo(s) criado(s), ${pulados} já existia(m).`);
  console.log("Nenhum palpite ou pontuação existente foi alterado (operação só de inserção).");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
