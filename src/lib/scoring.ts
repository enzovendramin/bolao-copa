// Regras de pontuação do bolão:
// - Placar exato:                          5 pontos
// - Acertou vencedor ou empate:            2 pontos
// - Errou:                                 0 pontos
// - Chute do campeão (acertou a campeã):  10 pontos (somados ao ranking
//   quando o admin define a seleção campeã ao final da Copa)
// Pênaltis não alteram o placar: o resultado oficial registrado já é o do
// tempo regulamentar + prorrogação.

export const POINTS_EXACT = 5;
export const POINTS_OUTCOME = 2;
export const POINTS_CHAMPION = 10;

export type ScoreResult = {
  points: number;
  isExact: boolean;
  isOutcome: boolean;
};

function outcome(a: number, b: number): -1 | 0 | 1 {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

export function scorePrediction(
  predA: number,
  predB: number,
  realA: number,
  realB: number
): ScoreResult {
  const isOutcome = outcome(predA, predB) === outcome(realA, realB);
  const isExact = predA === realA && predB === realB;
  const points = isExact ? POINTS_EXACT : isOutcome ? POINTS_OUTCOME : 0;
  return { points, isExact, isOutcome };
}
