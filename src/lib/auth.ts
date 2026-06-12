import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { db } from "./db";

const COOKIE_NAME = "session";
const SESSION_DAYS = 30;

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

// cache() evita múltiplas consultas ao banco na mesma renderização.
export const getCurrentUser = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
});

// Para páginas do app: exige login + aprovação.
export async function requireApprovedUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.status !== "APPROVED") redirect("/aguardando");
  return user;
}

// Para o painel administrativo.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.role !== "ADMIN") redirect("/inicio");
  return user;
}
