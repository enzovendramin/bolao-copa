// Limite simples de tentativas (em memória) para o login.
// Em serverless o estado pode reiniciar entre instâncias — é uma proteção de
// melhor esforço contra força bruta, suficiente para o porte do app.
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max = 10, windowMs = 15 * 60_000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}
