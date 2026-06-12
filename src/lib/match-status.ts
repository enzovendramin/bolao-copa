// Status derivado do jogo — nunca armazenado, sempre calculado.
// Garante o bloqueio de palpites exatamente no horário de início,
// sem depender de nenhuma ação manual do administrador.

export type MatchStatus = "ABERTO" | "FECHADO" | "FINALIZADO";

export type MatchLike = {
  kickoff: Date;
  scoreA: number | null;
  scoreB: number | null;
  predictionsOverride?: string | null;
};

export function matchStatus(match: MatchLike, now: Date = new Date()): MatchStatus {
  if (match.scoreA !== null && match.scoreB !== null) return "FINALIZADO";
  if (now >= match.kickoff) return "FECHADO";
  return "ABERTO";
}

// Janela automática: palpites abrem alguns dias antes de cada jogo,
// para a tela de palpites não ficar lotada de uma vez.
export const PREDICTION_WINDOW_DAYS = 7;

// Aberto para palpites = ainda não começou E (liberado pelo admin OU dentro
// da janela automática). Admin pode forçar OPEN/CLOSED por jogo.
export function isOpenForPredictions(match: MatchLike, now: Date = new Date()): boolean {
  if (matchStatus(match, now) !== "ABERTO") return false;
  const mode = match.predictionsOverride ?? null;
  if (mode === "OPEN") return true;
  if (mode === "CLOSED") return false;
  const opensAt = new Date(match.kickoff.getTime() - PREDICTION_WINDOW_DAYS * 24 * 3600_000);
  return now >= opensAt;
}

// Palpites de todos só ficam visíveis após o início da partida.
export function predictionsVisible(match: MatchLike, now: Date = new Date()): boolean {
  return matchStatus(match, now) !== "ABERTO";
}

export const STATUS_LABEL: Record<MatchStatus, string> = {
  ABERTO: "Aberto para palpites",
  FECHADO: "Fechado",
  FINALIZADO: "Finalizado",
};
