// Testes da retrospectiva com dados fictícios (não usa banco).
import { computeAwards, computeSummary, RetroUser } from "../src/lib/retro";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("FALHOU: " + msg);
  console.log("OK:", msg);
}

let matchSeq = 0;
const P = (
  scoreA: number, scoreB: number, realA: number, realB: number,
  extra?: Partial<{ teamA: string; teamB: string; phase: string; matchId: string }>
) => {
  const isExact = scoreA === realA && scoreB === realB;
  const oc = (a: number, b: number) => Math.sign(a - b);
  const isOutcome = oc(scoreA, scoreB) === oc(realA, realB);
  return {
    matchId: extra?.matchId ?? `m${matchSeq++}`,
    teamA: extra?.teamA ?? "BR", teamB: extra?.teamB ?? "AR", phase: extra?.phase ?? "Final",
    scoreA, scoreB, realA, realB,
    points: isExact ? 5 : isOutcome ? 2 : 0, isExact, isOutcome,
  };
};

const users: RetroUser[] = [
  // João: 2 exatos, otimista, acertou campeão
  { name: "João", championPick: "ES", points: 20, predictions: [P(2, 1, 2, 1), P(3, 0, 3, 0), P(4, 2, 1, 1)] },
  // Maria: 1 exato, média baixa
  { name: "Maria", championPick: "BR", points: 12, predictions: [P(1, 0, 1, 0), P(0, 0, 2, 1), P(0, 1, 0, 3)] },
  // Pedro: 0 exatos, muitos furos
  { name: "Pedro", championPick: "FR", points: 2, predictions: [P(0, 2, 3, 0), P(1, 3, 2, 0), P(0, 0, 1, 1, { phase: "Final" })] },
];

const awards = computeAwards(users, "ES");
const byTitle = (t: string) => awards.find((a) => a.title === t);

assert(byTitle("Campeão do bolão")?.winner === "João", "campeão = João (20 pts)");
assert(byTitle("O Nostradamus")?.winner === "João", "Nostradamus = João (2 exatos)");
assert(byTitle("O Pé-frio")?.winner === "Pedro", "pé-frio = Pedro (3 furos)");
assert(byTitle("O Otimista")?.winner === "João", "otimista = João (maior média de gols)");
assert(byTitle("Acertou o campeão")?.winner === "João", "acertou campeão = João (ES)");
assert(byTitle("A cravada da Copa")?.winner === "João", "cravada = João (3x0, maior goleada exata)");

// Empate no topo do ranking
const empatados: RetroUser[] = [
  { name: "Ana", championPick: null, points: 10, predictions: [P(1, 0, 1, 0)] },
  { name: "Bia", championPick: null, points: 10, predictions: [P(2, 2, 2, 2)] },
];
assert(computeAwards(empatados, null).find((a) => a.title === "Campeão do bolão")?.winner === "Ana e Bia",
  "empate no 1º lugar lista os dois");

// --- Novos prêmios ---
const g1: RetroUser = { name: "Gêmeo1", championPick: null, points: 0, predictions: [P(2, 1, 3, 0, { matchId: "j1" }), P(1, 1, 1, 1, { matchId: "j2" })] };
const g2: RetroUser = { name: "Gêmeo2", championPick: null, points: 0, predictions: [P(2, 1, 3, 0, { matchId: "j1" }), P(0, 0, 1, 1, { matchId: "j2" })] };
const gAwards = computeAwards([g1, g2], null);
assert(gAwards.find((a) => a.title === "Almas gêmeas")?.winner === "Gêmeo1 & Gêmeo2", "almas gêmeas = a dupla (1 palpite idêntico)");
assert(gAwards.find((a) => a.title === "O Eterno Quase")?.winner === "Gêmeo2", "eterno quase = Gêmeo2 (2 quases)");

// Zebra: em z1 (3 palpiteiros) só Za acerta o resultado
const zA: RetroUser = { name: "Za", championPick: null, points: 0, predictions: [P(1, 0, 1, 0, { matchId: "z1" })] };
const zB: RetroUser = { name: "Zb", championPick: null, points: 0, predictions: [P(0, 1, 1, 0, { matchId: "z1" })] };
const zC: RetroUser = { name: "Zc", championPick: null, points: 0, predictions: [P(0, 2, 1, 0, { matchId: "z1" })] };
assert(computeAwards([zA, zB, zC], null).find((a) => a.title === "A Zebra")?.winner === "Za", "zebra = Za (1 de 3 cravou)");

const resumo = computeSummary(users);
assert(resumo.participantes === 3, "resumo: 3 participantes");
assert(resumo.totalPalpites === 9, "resumo: 9 palpites");
assert(resumo.totalExatos === 3, "resumo: 3 placares exatos (João 2 + Maria 1)");

console.log("\nTodos os testes da retrospectiva passaram.");
