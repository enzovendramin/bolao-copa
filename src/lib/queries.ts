import "server-only";
import { db } from "./db";
import { cache } from "react";
import { TRACKED_CODES } from "./teams";

export const getActiveEdition = cache(async () => {
  return db.edition.findFirst({ where: { isActive: true } });
});

export type RankingRow = {
  userId: string;
  name: string;
  position: number | null;
  previousPosition: number | null;
  points: number;
  exactCount: number;
  outcomeCount: number;
  championPick: string | null;
};

// Trava do "Chute do Campeão".
// Padrão (AUTO): editável durante toda a fase de grupos; trava quando o
// primeiro jogo de mata-mata começa. O admin pode forçar travado/liberado.
export type ChampionLock = {
  locked: boolean;
  deadline: Date | null; // início do 1º jogo de mata-mata, se já cadastrado
  mode: "AUTO" | "LOCKED" | "UNLOCKED";
};

export const getChampionLock = cache(async (editionId: string): Promise<ChampionLock> => {
  const [edition, firstKnockout] = await Promise.all([
    db.edition.findUnique({ where: { id: editionId } }),
    db.match.findFirst({
      where: { editionId, phase: { not: "Fase de Grupos" } },
      orderBy: { kickoff: "asc" },
      select: { kickoff: true },
    }),
  ]);
  const mode = (edition?.championLockOverride ?? "AUTO") as ChampionLock["mode"];
  const deadline = firstKnockout?.kickoff ?? null;
  const locked =
    mode === "LOCKED"
      ? true
      : mode === "UNLOCKED"
        ? false
        : deadline !== null && new Date() >= deadline;
  return { locked, deadline, mode };
});

// Jogos que valem palpite/pontos: envolvem uma das 6 seleções OU são de
// mata-mata (qualquer fase != "Fase de Grupos"). Os demais só aparecem na
// Agenda. Equivale à função matchCountsForPool (src/lib/teams.ts) — manter
// os dois em sincronia.
export const POOL_MATCH_FILTER = {
  OR: [
    { teamA: { in: [...TRACKED_CODES] } },
    { teamB: { in: [...TRACKED_CODES] } },
    { phase: { not: "Fase de Grupos" } },
  ],
};

export const getRankingRows = cache(async (editionId: string): Promise<RankingRow[]> => {
  const parts = await db.participation.findMany({
    where: { editionId, user: { status: "APPROVED" } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ points: "desc" }, { user: { name: "asc" } }],
  });
  return parts.map((p) => ({
    userId: p.user.id,
    name: p.user.name,
    position: p.position,
    previousPosition: p.previousPosition,
    points: p.points,
    exactCount: p.exactCount,
    outcomeCount: p.outcomeCount,
    championPick: p.championPick,
  }));
});
