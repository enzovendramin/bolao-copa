// Estatísticas de encerramento ("Retrospectiva da Copa").
// Funções puras: recebem os dados já carregados e devolvem os prêmios.
// Assim dá para testar sem banco (ver scripts/test-retro.ts).
import { teamName } from "./teams";

export type RetroPrediction = {
  teamA: string;
  teamB: string;
  phase: string;
  scoreA: number; // palpite
  scoreB: number;
  realA: number; // resultado oficial
  realB: number;
  points: number;
  isExact: boolean;
  isOutcome: boolean;
};

export type RetroUser = {
  name: string;
  championPick: string | null;
  points: number;
  predictions: RetroPrediction[]; // só de jogos finalizados que contam
};

export type Award = {
  emoji: string;
  title: string;
  winner: string; // nome(s)
  detail: string;
};

export type RetroSummary = {
  participantes: number;
  totalPalpites: number;
  totalExatos: number;
  placarMaisComum: string | null;
};

function juntar(nomes: string[]): string {
  if (nomes.length === 0) return "—";
  if (nomes.length === 1) return nomes[0];
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`;
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

// Nomes que maximizam (dir=1) ou minimizam (dir=-1) uma métrica.
// Ignora quem tem 0 palpites quando exigirMin=true.
function extremos(
  users: RetroUser[],
  metric: (u: RetroUser) => number,
  dir: 1 | -1,
  exigirPalpites = true
): { nomes: string[]; valor: number } | null {
  const elegiveis = exigirPalpites ? users.filter((u) => u.predictions.length > 0) : users;
  if (elegiveis.length === 0) return null;
  let melhor = dir === 1 ? -Infinity : Infinity;
  for (const u of elegiveis) {
    const v = metric(u);
    if (dir === 1 ? v > melhor : v < melhor) melhor = v;
  }
  const nomes = elegiveis.filter((u) => metric(u) === melhor).map((u) => u.name);
  return { nomes, valor: melhor };
}

const exactCount = (u: RetroUser) => u.predictions.filter((p) => p.isExact).length;
const zeroCount = (u: RetroUser) => u.predictions.filter((p) => p.points === 0).length;
const avgGols = (u: RetroUser) =>
  u.predictions.reduce((s, p) => s + p.scoreA + p.scoreB, 0) / u.predictions.length;

export function computeSummary(users: RetroUser[]): RetroSummary {
  const todos = users.flatMap((u) => u.predictions);
  const contagem = new Map<string, number>();
  for (const p of todos) {
    const k = `${p.scoreA}×${p.scoreB}`;
    contagem.set(k, (contagem.get(k) ?? 0) + 1);
  }
  let placarMaisComum: string | null = null;
  let max = 0;
  for (const [k, n] of contagem) if (n > max) { max = n; placarMaisComum = k; }

  return {
    participantes: users.length,
    totalPalpites: todos.length,
    totalExatos: todos.filter((p) => p.isExact).length,
    placarMaisComum,
  };
}

export function computeAwards(users: RetroUser[], championTeam: string | null): Award[] {
  const awards: Award[] = [];

  // 🏆 Campeão do bolão
  const campeao = extremos(users, (u) => u.points, 1, false);
  if (campeao) {
    awards.push({
      emoji: "🏆",
      title: "Campeão do bolão",
      winner: juntar(campeao.nomes),
      detail: `${campeao.valor} pontos`,
    });
  }

  // 🔮 Nostradamus — mais placares exatos
  const nostra = extremos(users, exactCount, 1);
  if (nostra && nostra.valor > 0) {
    awards.push({
      emoji: "🔮",
      title: "O Nostradamus",
      winner: juntar(nostra.nomes),
      detail: `${nostra.valor} ${nostra.valor === 1 ? "placar exato" : "placares exatos"} cravados`,
    });
  }

  // 🥶 Pé-frio — mais palpites zerados
  const peFrio = extremos(users, zeroCount, 1);
  if (peFrio && peFrio.valor > 0) {
    awards.push({
      emoji: "🥶",
      title: "O Pé-frio",
      winner: juntar(peFrio.nomes),
      detail: `${peFrio.valor} ${peFrio.valor === 1 ? "palpite furado" : "palpites furados"}`,
    });
  }

  // 😍 Otimista / 😒 Pessimista — média de gols palpitada
  const otimista = extremos(users, avgGols, 1);
  if (otimista) {
    awards.push({
      emoji: "😍",
      title: "O Otimista",
      winner: juntar(otimista.nomes),
      detail: `${otimista.valor.toFixed(1)} gols por jogo, em média`,
    });
  }
  const pessimista = extremos(users, avgGols, -1);
  if (pessimista && pessimista.valor !== otimista?.valor) {
    awards.push({
      emoji: "🧱",
      title: "O Retranqueiro",
      winner: juntar(pessimista.nomes),
      detail: `só ${pessimista.valor.toFixed(1)} gols por jogo, em média`,
    });
  }

  // 🎯 Cravada da Copa — o placar exato de maior goleada
  let cravada: { nome: string; p: RetroPrediction } | null = null;
  for (const u of users) {
    for (const p of u.predictions) {
      if (!p.isExact) continue;
      const gols = p.realA + p.realB;
      if (!cravada || gols > cravada.p.realA + cravada.p.realB) cravada = { nome: u.name, p };
    }
  }
  if (cravada) {
    awards.push({
      emoji: "🎯",
      title: "A cravada da Copa",
      winner: cravada.nome,
      detail: `previu ${teamName(cravada.p.teamA)} ${cravada.p.realA}×${cravada.p.realB} ${teamName(cravada.p.teamB)} — na mosca!`,
    });
  }

  // 👑 Acertou o campeão
  if (championTeam) {
    const acertaram = users.filter((u) => u.championPick === championTeam).map((u) => u.name);
    if (acertaram.length > 0) {
      awards.push({
        emoji: "👑",
        title: "Acertou o campeão",
        winner: juntar(acertaram),
        detail: "cravou a seleção campeã (+10 pts)",
      });
    }
  }

  // ⚽ Mais dedicado — mais palpites feitos
  const dedicado = extremos(users, (u) => u.predictions.length, 1);
  if (dedicado && dedicado.valor > 0) {
    awards.push({
      emoji: "⚽",
      title: "O Mais dedicado",
      winner: juntar(dedicado.nomes),
      detail: `palpitou em ${dedicado.valor} jogos`,
    });
  }

  return awards;
}
