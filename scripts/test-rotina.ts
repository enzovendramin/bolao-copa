// Testes das regras do dia a dia: fuso de Paris, janela de palpites,
// travas manuais e visibilidade. Roda em memória (não toca no banco).
import { parseParisDateTime, toParisInputValue, formatTime } from "../src/lib/dates";
import {
  isOpenForPredictions,
  predictionsVisible,
  matchStatus,
  PREDICTION_WINDOW_DAYS,
} from "../src/lib/match-status";
import { matchCountsForPool } from "../src/lib/teams";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("FALHOU: " + msg);
  console.log("OK:", msg);
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

// ---------- Fuso de Paris ----------
// Verão europeu (CEST, UTC+2): 21:00 em Paris = 19:00 UTC
assert(
  parseParisDateTime("2026-07-01T21:00").toISOString() === "2026-07-01T19:00:00.000Z",
  "verão: 21:00 Paris → 19:00 UTC"
);
// Inverno europeu (CET, UTC+1): 21:00 em Paris = 20:00 UTC
assert(
  parseParisDateTime("2026-12-01T21:00").toISOString() === "2026-12-01T20:00:00.000Z",
  "inverno: 21:00 Paris → 20:00 UTC"
);
// Ida e volta: o que o admin digita é o que ele vê de volta no formulário
assert(
  toParisInputValue(parseParisDateTime("2026-06-19T22:30")) === "2026-06-19T22:30",
  "ida e volta admin → banco → formulário sem deslocamento"
);
// Abertura da Copa: 13:00 na Cidade do México (UTC-6) = 21:00 em Paris
assert(
  formatTime(new Date("2026-06-11T19:00:00Z")) === "21:00",
  "jogo de abertura exibido às 21:00 de Paris"
);

// ---------- Janela automática de palpites ----------
const now = new Date();
const mk = (daysFromNow: number, override: string | null = null) => ({
  kickoff: new Date(now.getTime() + daysFromNow * DAY),
  scoreA: null,
  scoreB: null,
  predictionsOverride: override,
});

assert(isOpenForPredictions(mk(2), now) === true, "jogo em 2 dias: aberto");
assert(
  isOpenForPredictions(mk(PREDICTION_WINDOW_DAYS - 0.5), now) === true,
  "jogo dentro da janela de 7 dias: aberto"
);
assert(
  isOpenForPredictions(mk(PREDICTION_WINDOW_DAYS + 0.5), now) === false,
  "jogo fora da janela de 7 dias: ainda fechado"
);
assert(
  isOpenForPredictions(mk(20, "OPEN"), now) === true,
  "admin força liberar: aberto mesmo a 20 dias"
);
assert(
  isOpenForPredictions(mk(2, "CLOSED"), now) === false,
  "admin força bloquear: fechado mesmo a 2 dias"
);
assert(
  isOpenForPredictions(mk(-0.1, "OPEN"), now) === false,
  "jogo já iniciado: fechado mesmo com liberação forçada"
);

// ---------- Visibilidade dos palpites dos outros ----------
assert(predictionsVisible(mk(1), now) === false, "antes do jogo: palpites ocultos");
assert(predictionsVisible(mk(-0.1), now) === true, "após o início: palpites visíveis");

// ---------- Status derivado ----------
assert(matchStatus(mk(1), now) === "ABERTO", "futuro sem placar: ABERTO");
assert(matchStatus(mk(-0.1), now) === "FECHADO", "iniciado sem placar: FECHADO");
assert(
  matchStatus({ ...mk(-1), scoreA: 2, scoreB: 1 }, now) === "FINALIZADO",
  "com placar oficial: FINALIZADO"
);

// ---------- O que vale palpite/pontos (matchCountsForPool) ----------
const grupos = "Fase de Grupos";
const r32 = "Rodada de 32";
const oitavas = "Oitavas de Final";
assert(
  matchCountsForPool({ teamA: "BR", teamB: "MA", phase: grupos }) === true,
  "grupos com seleção do bolão: conta"
);
assert(
  matchCountsForPool({ teamA: "MX", teamB: "EC", phase: grupos }) === false,
  "grupos sem seleção do bolão: NÃO conta (só Agenda)"
);
assert(
  matchCountsForPool({ teamA: "CO", teamB: "GH", phase: r32 }) === false,
  "Rodada de 32 sem seleção do bolão: NÃO conta (só as 6 seleções na R32)"
);
assert(
  matchCountsForPool({ teamA: "AR", teamB: "CV", phase: r32 }) === true,
  "Rodada de 32 com seleção do bolão: conta"
);
assert(
  matchCountsForPool({ teamA: "CA", teamB: "MA", phase: oitavas }) === true,
  "Oitavas sem seleção do bolão: conta (abertura a partir das Oitavas)"
);
assert(
  matchCountsForPool({ teamA: "BR", teamB: "NO", phase: oitavas }) === true,
  "Oitavas com seleção do bolão: conta"
);

console.log("\nTodos os testes de rotina passaram.");
