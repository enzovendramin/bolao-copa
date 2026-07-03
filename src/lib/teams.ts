// Seleções disponíveis para cadastro de jogos.
// O bolão só considera partidas que envolvam ao menos uma seleção "tracked".

export type Team = { code: string; name: string };

export const TRACKED_CODES = ["BR", "AR", "FR", "ES", "DE", "PT"] as const;

export const TEAMS: Team[] = [
  { code: "BR", name: "Brasil" },
  { code: "AR", name: "Argentina" },
  { code: "FR", name: "França" },
  { code: "ES", name: "Espanha" },
  { code: "DE", name: "Alemanha" },
  { code: "PT", name: "Portugal" },
  { code: "DZ", name: "Argélia" },
  { code: "AU", name: "Austrália" },
  { code: "BA", name: "Bósnia e Herzegovina" },
  { code: "CV", name: "Cabo Verde" },
  { code: "AT", name: "Áustria" },
  { code: "BE", name: "Bélgica" },
  { code: "BO", name: "Bolívia" },
  { code: "CM", name: "Camarões" },
  { code: "CA", name: "Canadá" },
  { code: "QA", name: "Catar" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colômbia" },
  { code: "KR", name: "Coreia do Sul" },
  { code: "CI", name: "Costa do Marfim" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croácia" },
  { code: "CW", name: "Curaçao" },
  { code: "DK", name: "Dinamarca" },
  { code: "EC", name: "Equador" },
  { code: "EG", name: "Egito" },
  { code: "SCT", name: "Escócia" },
  { code: "US", name: "Estados Unidos" },
  { code: "GH", name: "Gana" },
  { code: "HT", name: "Haiti" },
  { code: "NL", name: "Holanda" },
  { code: "ENG", name: "Inglaterra" },
  { code: "IR", name: "Irã" },
  { code: "IQ", name: "Iraque" },
  { code: "IT", name: "Itália" },
  { code: "JP", name: "Japão" },
  { code: "JO", name: "Jordânia" },
  { code: "MA", name: "Marrocos" },
  { code: "MX", name: "México" },
  { code: "NG", name: "Nigéria" },
  { code: "NO", name: "Noruega" },
  { code: "NZ", name: "Nova Zelândia" },
  { code: "PA", name: "Panamá" },
  { code: "PY", name: "Paraguai" },
  { code: "PE", name: "Peru" },
  { code: "PL", name: "Polônia" },
  { code: "CD", name: "RD Congo" },
  { code: "CZ", name: "Tchéquia" },
  { code: "WAL", name: "País de Gales" },
  { code: "SA", name: "Arábia Saudita" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Sérvia" },
  { code: "CH", name: "Suíça" },
  { code: "SE", name: "Suécia" },
  { code: "TN", name: "Tunísia" },
  { code: "TR", name: "Turquia" },
  { code: "UA", name: "Ucrânia" },
  { code: "UY", name: "Uruguai" },
  { code: "UZ", name: "Uzbequistão" },
  { code: "ZA", name: "África do Sul" },
];

// Bandeiras como imagem (flagcdn.com): renderizam igual em qualquer
// aparelho — emojis de bandeira não funcionam em PCs Windows.
const FLAG_CDN_CODES: Record<string, string> = {
  ENG: "gb-eng",
  SCT: "gb-sct",
  WAL: "gb-wls",
};

export function flagUrl(code: string): string {
  const cdn = FLAG_CDN_CODES[code] ?? code.toLowerCase();
  return `https://flagcdn.com/w80/${cdn}.png`;
}

export function teamName(code: string): string {
  return TEAMS.find((t) => t.code === code)?.name ?? code;
}

export function isTracked(code: string): boolean {
  return (TRACKED_CODES as readonly string[]).includes(code);
}

// Fases em que TODO jogo vale palpite/pontos, independentemente das 6
// seleções (a "abertura" combinada). Começa nas Oitavas — a Fase de Grupos
// E a Rodada de 32 ficam de fora de propósito: nelas vale a regra normal
// (só jogos com uma das 6 seleções contam).
export const OPEN_POOL_PHASES: readonly string[] = [
  "Oitavas de Final",
  "Quartas de Final",
  "Semifinal",
  "Disputa de 3º Lugar",
  "Final",
];

// Um jogo vale palpite/pontos ("conta para o bolão") se:
// - envolver ao menos uma das 6 seleções do bolão, OU
// - for de uma fase "aberta" (Oitavas em diante).
// Regra única do sistema — o filtro Prisma equivalente é POOL_MATCH_FILTER
// (src/lib/queries.ts). Manter os dois em sincronia.
export function matchCountsForPool(m: {
  teamA: string;
  teamB: string;
  phase: string;
}): boolean {
  return (
    isTracked(m.teamA) || isTracked(m.teamB) || OPEN_POOL_PHASES.includes(m.phase)
  );
}

export const PHASES = [
  "Fase de Grupos",
  "Rodada de 32",
  "Oitavas de Final",
  "Quartas de Final",
  "Semifinal",
  "Disputa de 3º Lugar",
  "Final",
] as const;
