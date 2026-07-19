// Estatísticas de encerramento ("Retrospectiva da Copa").
// Funções puras: recebem os dados já carregados e devolvem os prêmios.
// Assim dá para testar sem banco (ver scripts/test-retro.ts).
import { teamName, PHASES } from "./teams";

export type RetroPrediction = {
  matchId: string;
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

  // 🧊 O Rei do Empate — mais empates previstos com sucesso
  const empate = extremos(
    users,
    (u) => u.predictions.filter((p) => p.scoreA === p.scoreB && p.realA === p.realB).length,
    1
  );
  if (empate && empate.valor > 0) {
    awards.push({
      emoji: "🧊",
      title: "O Rei do Empate",
      winner: juntar(empate.nomes),
      detail: `${empate.valor} ${empate.valor === 1 ? "empate previsto" : "empates previstos"} com sucesso`,
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

  // 📏 O Eterno Quase — acertou o vencedor, mas errou o placar
  const quase = extremos(
    users,
    (u) => u.predictions.filter((p) => p.isOutcome && !p.isExact).length,
    1
  );
  if (quase && quase.valor > 0) {
    awards.push({
      emoji: "📏",
      title: "O Eterno Quase",
      winner: juntar(quase.nomes),
      detail: `${quase.valor} vezes acertou quem venceu, mas não o placar`,
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

  // 🤝 Almas gêmeas — a dupla com mais palpites idênticos
  let dupla: { a: string; b: string; n: number } | null = null;
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const porJogoB = new Map(users[j].predictions.map((p) => [p.matchId, p]));
      let n = 0;
      for (const pa of users[i].predictions) {
        const pb = porJogoB.get(pa.matchId);
        if (pb && pb.scoreA === pa.scoreA && pb.scoreB === pa.scoreB) n++;
      }
      if (n > 0 && (!dupla || n > dupla.n)) dupla = { a: users[i].name, b: users[j].name, n };
    }
  }
  if (dupla) {
    awards.push({
      emoji: "🤝",
      title: "Almas gêmeas",
      winner: `${dupla.a} & ${dupla.b}`,
      detail: `${dupla.n} palpites idênticos — combinaram?`,
    });
  }

  // 🧨 A Zebra — o acerto de resultado mais na contramão do grupo
  const porJogo = new Map<string, RetroPrediction[]>();
  for (const u of users)
    for (const p of u.predictions) {
      const arr = porJogo.get(p.matchId) ?? [];
      arr.push(p);
      porJogo.set(p.matchId, arr);
    }
  let zebra: { nome: string; p: RetroPrediction; acertos: number; total: number } | null = null;
  for (const u of users) {
    for (const p of u.predictions) {
      if (!p.isOutcome) continue;
      const todos = porJogo.get(p.matchId)!;
      if (todos.length < 3) continue; // precisa de gente suficiente para ser "zebra"
      const acertos = todos.filter((x) => x.isOutcome).length;
      const ratio = acertos / todos.length;
      const rZebra = zebra ? zebra.acertos / zebra.total : Infinity;
      if (ratio < rZebra || (ratio === rZebra && todos.length > (zebra?.total ?? 0))) {
        zebra = { nome: u.name, p, acertos, total: todos.length };
      }
    }
  }
  if (zebra) {
    awards.push({
      emoji: "🧨",
      title: "A Zebra",
      winner: zebra.nome,
      detail: `só ${zebra.acertos} de ${zebra.total} cravaram o resultado de ${teamName(zebra.p.teamA)} × ${teamName(zebra.p.teamB)}`,
    });
  }

  return awards;
}

// ---------- Curiosidades (fatos do grupo/da Copa) ----------

export type Curiosidade = { emoji: string; title: string; value: string };

export function computeCuriosidades(
  users: RetroUser[],
  finishedMatches: { teamA: string; teamB: string; phase: string }[],
  championTeam: string | null
): Curiosidade[] {
  const cur: Curiosidade[] = [];

  // Contagem de chutes do campeão
  const picks = new Map<string, number>();
  for (const u of users) if (u.championPick) picks.set(u.championPick, (picks.get(u.championPick) ?? 0) + 1);

  // 🏆 O time mais acreditado
  let topPick: { code: string; n: number } | null = null;
  for (const [code, n] of picks) if (!topPick || n > topPick.n) topPick = { code, n };
  if (topPick) {
    cur.push({
      emoji: "🏆",
      title: "O time mais acreditado",
      value: `${teamName(topPick.code)} — ${topPick.n} ${topPick.n === 1 ? "aposta" : "apostas"} no título`,
    });
  }

  // 💔 A maior decepção (só faz sentido depois de definida a campeã)
  if (championTeam) {
    const idxFase = (ph: string) => PHASES.indexOf(ph as (typeof PHASES)[number]);
    const furthest = new Map<string, number>();
    for (const m of finishedMatches) {
      for (const t of [m.teamA, m.teamB]) {
        const i = idxFase(m.phase);
        if (i > (furthest.get(t) ?? -1)) furthest.set(t, i);
      }
    }
    let dec: { code: string; n: number } | null = null;
    for (const [code, n] of picks) {
      if (code === championTeam) continue;
      if (!dec || n > dec.n) dec = { code, n };
    }
    if (dec) {
      const fi = furthest.get(dec.code);
      let onde: string;
      if (fi === undefined) onde = "decepcionou";
      else if (fi >= PHASES.indexOf("Final")) onde = "foi vice-campeã, mas não levou a taça";
      else if (fi === PHASES.indexOf("Disputa de 3º Lugar")) onde = "parou na semifinal";
      else onde = `parou nas ${PHASES[fi]}`;
      cur.push({
        emoji: "💔",
        title: "A maior decepção",
        value: `${teamName(dec.code)} — ${dec.n} cravaram o título, mas ${onde}`,
      });
    }
  }

  // Agrupa os palpites por jogo (para os fatos de "grupo x resultado")
  type Grp = {
    teamA: string; teamB: string; realA: number; realB: number;
    preds: { oc: number; isOutcome: boolean }[];
  };
  const grupos = new Map<string, Grp>();
  for (const u of users)
    for (const p of u.predictions) {
      let g = grupos.get(p.matchId);
      if (!g) { g = { teamA: p.teamA, teamB: p.teamB, realA: p.realA, realB: p.realB, preds: [] }; grupos.set(p.matchId, g); }
      g.preds.push({ oc: Math.sign(p.scoreA - p.scoreB), isOutcome: p.isOutcome });
    }
  const desfecho = (oc: number, g: Grp) =>
    oc > 0 ? `vitória de ${teamName(g.teamA)}` : oc < 0 ? `vitória de ${teamName(g.teamB)}` : "empate";

  // 🐑 O palpite unânime (maior concordância no vencedor)
  let unanime: { g: Grp; oc: number; n: number; total: number } | null = null;
  for (const g of grupos.values()) {
    const total = g.preds.length;
    if (total < 3) continue;
    const cont = new Map<number, number>();
    for (const p of g.preds) cont.set(p.oc, (cont.get(p.oc) ?? 0) + 1);
    let bestOc = 0, bestN = -1;
    for (const [oc, n] of cont) if (n > bestN) { bestN = n; bestOc = oc; }
    const rUn = unanime ? unanime.n / unanime.total : -1;
    if (bestN / total > rUn || (bestN / total === rUn && total > (unanime?.total ?? 0)))
      unanime = { g, oc: bestOc, n: bestN, total };
  }
  if (unanime) {
    cur.push({
      emoji: "🐑",
      title: "O palpite unânime",
      value: `${unanime.n} de ${unanime.total} apostaram em ${desfecho(unanime.oc, unanime.g)} — ${teamName(unanime.g.teamA)} × ${teamName(unanime.g.teamB)}`,
    });
  }

  // 🧨 O resultado que mais surpreendeu (menos acertos)
  let surpresa: { g: Grp; acertos: number; total: number } | null = null;
  // 🤝 O jogo do consenso (mais acertos)
  let consenso: { g: Grp; acertos: number; total: number } | null = null;
  for (const g of grupos.values()) {
    const total = g.preds.length;
    if (total < 3) continue;
    const acertos = g.preds.filter((p) => p.isOutcome).length;
    const ratio = acertos / total;
    const rS = surpresa ? surpresa.acertos / surpresa.total : Infinity;
    if (ratio < rS || (ratio === rS && total > (surpresa?.total ?? 0))) surpresa = { g, acertos, total };
    const rC = consenso ? consenso.acertos / consenso.total : -1;
    if (ratio > rC || (ratio === rC && total > (consenso?.total ?? 0))) consenso = { g, acertos, total };
  }
  if (surpresa) {
    cur.push({
      emoji: "🧨",
      title: "O resultado que mais surpreendeu",
      value: `${teamName(surpresa.g.teamA)} ${surpresa.g.realA}×${surpresa.g.realB} ${teamName(surpresa.g.teamB)} — ${surpresa.acertos} de ${surpresa.total} cravaram`,
    });
  }
  if (consenso && consenso.acertos > 0) {
    cur.push({
      emoji: "🤝",
      title: "O jogo do consenso",
      value: `${teamName(consenso.g.teamA)} × ${teamName(consenso.g.teamB)} — ${consenso.acertos} de ${consenso.total} acertaram o resultado`,
    });
  }

  // 🌪️ O palpite mais fora da realidade
  let fora: { nome: string; p: RetroPrediction; err: number } | null = null;
  for (const u of users)
    for (const p of u.predictions) {
      const err = Math.abs(p.scoreA - p.realA) + Math.abs(p.scoreB - p.realB);
      if (!fora || err > fora.err) fora = { nome: u.name, p, err };
    }
  if (fora && fora.err > 0) {
    cur.push({
      emoji: "🌪️",
      title: "O palpite mais fora da realidade",
      value: `${fora.nome} chutou ${teamName(fora.p.teamA)} ${fora.p.scoreA}×${fora.p.scoreB} ${teamName(fora.p.teamB)} — e deu ${fora.p.realA}×${fora.p.realB}`,
    });
  }

  return cur;
}
