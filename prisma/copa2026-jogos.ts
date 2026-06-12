// Tabela oficial da fase de grupos da Copa do Mundo 2026 (72 jogos).
// Fonte: Al Jazeera / FIFA (horários locais dos estádios convertidos para UTC).
// Fusos usados na conversão (junho/2026): ET=UTC-4, CDT=UTC-5,
// CST México=UTC-6 (sem horário de verão), PT=UTC-7.
// Mata-mata: cadastrar pelo painel admin conforme os confrontos forem definidos.

export type JogoCopa = { a: string; b: string; utc: string; grupo: string };

export const JOGOS_FASE_GRUPOS: JogoCopa[] = [
  // 11 de junho
  { a: "MX", b: "ZA", utc: "2026-06-11T19:00:00Z", grupo: "A" },
  { a: "KR", b: "CZ", utc: "2026-06-12T02:00:00Z", grupo: "A" },
  // 12 de junho
  { a: "CA", b: "BA", utc: "2026-06-12T19:00:00Z", grupo: "B" },
  { a: "US", b: "PY", utc: "2026-06-13T01:00:00Z", grupo: "D" },
  // 13 de junho
  { a: "QA", b: "CH", utc: "2026-06-13T19:00:00Z", grupo: "B" },
  { a: "BR", b: "MA", utc: "2026-06-13T22:00:00Z", grupo: "C" },
  { a: "HT", b: "SCT", utc: "2026-06-14T01:00:00Z", grupo: "C" },
  { a: "AU", b: "TR", utc: "2026-06-14T01:00:00Z", grupo: "D" },
  // 14 de junho
  { a: "DE", b: "CW", utc: "2026-06-14T17:00:00Z", grupo: "E" },
  { a: "NL", b: "JP", utc: "2026-06-14T20:00:00Z", grupo: "F" },
  { a: "CI", b: "EC", utc: "2026-06-14T23:00:00Z", grupo: "E" },
  { a: "SE", b: "TN", utc: "2026-06-15T02:00:00Z", grupo: "F" },
  // 15 de junho
  { a: "ES", b: "CV", utc: "2026-06-15T16:00:00Z", grupo: "H" },
  { a: "BE", b: "EG", utc: "2026-06-15T19:00:00Z", grupo: "G" },
  { a: "SA", b: "UY", utc: "2026-06-15T22:00:00Z", grupo: "H" },
  { a: "IR", b: "NZ", utc: "2026-06-16T01:00:00Z", grupo: "G" },
  // 16 de junho
  { a: "FR", b: "SN", utc: "2026-06-16T19:00:00Z", grupo: "I" },
  { a: "IQ", b: "NO", utc: "2026-06-16T22:00:00Z", grupo: "I" },
  { a: "AR", b: "DZ", utc: "2026-06-17T01:00:00Z", grupo: "J" },
  { a: "AT", b: "JO", utc: "2026-06-17T04:00:00Z", grupo: "J" },
  // 17 de junho
  { a: "PT", b: "CD", utc: "2026-06-17T17:00:00Z", grupo: "K" },
  { a: "ENG", b: "HR", utc: "2026-06-17T20:00:00Z", grupo: "L" },
  { a: "GH", b: "PA", utc: "2026-06-17T23:00:00Z", grupo: "L" },
  { a: "UZ", b: "CO", utc: "2026-06-18T02:00:00Z", grupo: "K" },
  // 18 de junho
  { a: "CZ", b: "ZA", utc: "2026-06-18T16:00:00Z", grupo: "A" },
  { a: "CH", b: "BA", utc: "2026-06-18T19:00:00Z", grupo: "B" },
  { a: "CA", b: "QA", utc: "2026-06-18T22:00:00Z", grupo: "B" },
  { a: "MX", b: "KR", utc: "2026-06-19T01:00:00Z", grupo: "A" },
  // 19 de junho
  { a: "US", b: "AU", utc: "2026-06-19T19:00:00Z", grupo: "D" },
  { a: "SCT", b: "MA", utc: "2026-06-19T22:00:00Z", grupo: "C" },
  { a: "BR", b: "HT", utc: "2026-06-20T00:30:00Z", grupo: "C" },
  { a: "TR", b: "PY", utc: "2026-06-20T04:00:00Z", grupo: "D" },
  // 20 de junho
  { a: "NL", b: "SE", utc: "2026-06-20T17:00:00Z", grupo: "F" },
  { a: "DE", b: "CI", utc: "2026-06-20T20:00:00Z", grupo: "E" },
  { a: "EC", b: "CW", utc: "2026-06-21T00:00:00Z", grupo: "E" },
  { a: "TN", b: "JP", utc: "2026-06-21T04:00:00Z", grupo: "F" },
  // 21 de junho
  { a: "ES", b: "SA", utc: "2026-06-21T16:00:00Z", grupo: "H" },
  { a: "BE", b: "IR", utc: "2026-06-21T19:00:00Z", grupo: "G" },
  { a: "UY", b: "CV", utc: "2026-06-21T22:00:00Z", grupo: "H" },
  { a: "NZ", b: "EG", utc: "2026-06-22T01:00:00Z", grupo: "G" },
  // 22 de junho
  { a: "AR", b: "AT", utc: "2026-06-22T17:00:00Z", grupo: "J" },
  { a: "FR", b: "IQ", utc: "2026-06-22T21:00:00Z", grupo: "I" },
  { a: "NO", b: "SN", utc: "2026-06-23T00:00:00Z", grupo: "I" },
  { a: "JO", b: "DZ", utc: "2026-06-23T03:00:00Z", grupo: "J" },
  // 23 de junho
  { a: "PT", b: "UZ", utc: "2026-06-23T17:00:00Z", grupo: "K" },
  { a: "ENG", b: "GH", utc: "2026-06-23T20:00:00Z", grupo: "L" },
  { a: "PA", b: "HR", utc: "2026-06-23T23:00:00Z", grupo: "L" },
  { a: "CO", b: "CD", utc: "2026-06-24T02:00:00Z", grupo: "K" },
  // 24 de junho (última rodada A/B/C, jogos simultâneos)
  { a: "CH", b: "CA", utc: "2026-06-24T19:00:00Z", grupo: "B" },
  { a: "BA", b: "QA", utc: "2026-06-24T19:00:00Z", grupo: "B" },
  { a: "SCT", b: "BR", utc: "2026-06-24T22:00:00Z", grupo: "C" },
  { a: "MA", b: "HT", utc: "2026-06-24T22:00:00Z", grupo: "C" },
  { a: "CZ", b: "MX", utc: "2026-06-25T01:00:00Z", grupo: "A" },
  { a: "ZA", b: "KR", utc: "2026-06-25T01:00:00Z", grupo: "A" },
  // 25 de junho (última rodada D/E/F)
  { a: "EC", b: "DE", utc: "2026-06-25T20:00:00Z", grupo: "E" },
  { a: "CW", b: "CI", utc: "2026-06-25T20:00:00Z", grupo: "E" },
  { a: "JP", b: "SE", utc: "2026-06-25T23:00:00Z", grupo: "F" },
  { a: "TN", b: "NL", utc: "2026-06-25T23:00:00Z", grupo: "F" },
  { a: "TR", b: "US", utc: "2026-06-26T02:00:00Z", grupo: "D" },
  { a: "PY", b: "AU", utc: "2026-06-26T02:00:00Z", grupo: "D" },
  // 26 de junho (última rodada G/H/I)
  { a: "NO", b: "FR", utc: "2026-06-26T19:00:00Z", grupo: "I" },
  { a: "SN", b: "IQ", utc: "2026-06-26T19:00:00Z", grupo: "I" },
  { a: "CV", b: "SA", utc: "2026-06-27T00:00:00Z", grupo: "H" },
  { a: "UY", b: "ES", utc: "2026-06-27T00:00:00Z", grupo: "H" },
  { a: "EG", b: "IR", utc: "2026-06-27T03:00:00Z", grupo: "G" },
  { a: "NZ", b: "BE", utc: "2026-06-27T03:00:00Z", grupo: "G" },
  // 27 de junho (última rodada J/K/L)
  { a: "PA", b: "ENG", utc: "2026-06-27T21:00:00Z", grupo: "L" },
  { a: "HR", b: "GH", utc: "2026-06-27T21:00:00Z", grupo: "L" },
  { a: "CO", b: "PT", utc: "2026-06-27T23:30:00Z", grupo: "K" },
  { a: "CD", b: "UZ", utc: "2026-06-27T23:30:00Z", grupo: "K" },
  { a: "DZ", b: "AT", utc: "2026-06-28T02:00:00Z", grupo: "J" },
  { a: "JO", b: "AR", utc: "2026-06-28T02:00:00Z", grupo: "J" },
];
