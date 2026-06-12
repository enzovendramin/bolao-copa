// Todas as datas são armazenadas em UTC e exibidas no horário de Paris
// (França), onde mora a maioria dos participantes.

const TZ = "Europe/Paris";

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Chave do dia (YYYY-MM-DD) e rótulo ("sábado, 13/06") no horário de Paris,
// para agrupar jogos por dia nas listas.
export function parisDayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function parisDayLabel(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

// "Relógio de parede" de Paris no instante d, em milissegundos UTC fictícios.
function wallTimeMs(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
}

// Converte o valor de um <input type="datetime-local"> (interpretado como
// horário de Paris) para Date em UTC, respeitando o horário de verão europeu.
export function parseParisDateTime(value: string): Date {
  const target = new Date(`${value}:00Z`).getTime();
  if (isNaN(target)) return new Date(NaN);
  let utc = target - 2 * 3600_000; // chute inicial: CEST (UTC+2)
  for (let i = 0; i < 2; i++) {
    utc += target - wallTimeMs(new Date(utc));
  }
  return new Date(utc);
}

// Converte um Date para o formato aceito por <input type="datetime-local">,
// no horário de Paris.
export function toParisInputValue(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
