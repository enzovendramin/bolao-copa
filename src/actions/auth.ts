"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

function fail(path: string, message: string): never {
  redirect(`${path}?erro=${encodeURIComponent(message)}`);
}

// Nome de usuário: 3–20 caracteres, letras minúsculas, números, ponto, hífen e _
const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;

export async function register(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 3) fail("/cadastro", "Informe seu nome completo.");
  if (!USERNAME_RE.test(username)) {
    fail("/cadastro", "Nome de usuário inválido: use de 3 a 20 letras minúsculas, números, ponto, hífen ou _ (sem espaços).");
  }
  if (password.length < 6) fail("/cadastro", "A senha deve ter pelo menos 6 caracteres.");

  const existing = await db.user.findUnique({ where: { username } });
  if (existing) fail("/cadastro", "Este nome de usuário já está em uso. Escolha outro.");

  const user = await db.user.create({
    data: { name, username, passwordHash: await bcrypt.hash(password, 10) },
  });

  await createSession(user.id);
  redirect("/aguardando");
}

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(`login:${ip}:${username}`)) {
    fail("/entrar", "Muitas tentativas. Aguarde alguns minutos e tente de novo.");
  }

  const user = await db.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    fail("/entrar", "Usuário ou senha incorretos.");
  }

  await createSession(user.id);
  if (user.status !== "APPROVED") redirect("/aguardando");
  redirect("/inicio");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const current = String(formData.get("current") ?? "");
  const newPassword = String(formData.get("new") ?? "");

  if (!(await bcrypt.compare(current, user.passwordHash))) {
    fail("/senha", "Senha atual incorreta.");
  }
  if (newPassword.length < 6) {
    fail("/senha", "A nova senha deve ter pelo menos 6 caracteres.");
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });
  redirect("/senha?ok=Senha alterada com sucesso!");
}

export async function refreshApprovalStatus() {
  const user = await getCurrentUser();
  if (user?.status === "APPROVED") redirect("/inicio");
  redirect("/aguardando");
}
