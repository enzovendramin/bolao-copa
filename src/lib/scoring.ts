// Regras de pontuação do bolão (valores padrão; cada servidor pode
// sobrescrever via variáveis de ambiente, permitindo regras diferentes
// por bolão sem alterar o código):
// - Placar exato (SCORE_EXACT, padrão 5)
// - Acertou vencedor ou empate (SCORE_OUTCOME, padrão 2)
// - Errou: 0
// - Chute do campeão (SCORE_CHAMPION, padrão 10), somado ao ranking quando
//   o admin define a seleção campeã ao final da Copa.
// Pênaltis não alteram o placar: o resultado oficial registrado já é o do
// tempo regulamentar + prorrogação.

const envInt = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const POINTS_EXACT = envInt(process.env.SCORE_EXACT, 5);
export const POINTS_OUTCOME = envInt(process.env.SCORE_OUTCOME, 2);
export const POINTS_CHAMPION = envInt(process.env.SCORE_CHAMPION, 10);

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
