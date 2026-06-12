"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PHASES, TEAMS, isTracked } from "@/lib/teams";
import { parseParisDateTime } from "@/lib/dates";
import { applyResult, recalcRanking } from "@/lib/ranking";

async function activeEdition() {
  const edition = await db.edition.findFirst({ where: { isActive: true } });
  if (!edition) throw new Error("Nenhuma edição ativa encontrada.");
  return edition;
}

function revalidateAll() {
  for (const p of ["/", "/inicio", "/palpites", "/ranking", "/historico", "/admin", "/admin/jogos", "/admin/resultados", "/admin/palpites"]) {
    revalidatePath(p);
  }
}

// ---------- Participantes ----------

export async function approveUser(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const edition = await activeEdition();

  await db.user.update({ where: { id: userId }, data: { status: "APPROVED" } });
  await db.participation.upsert({
    where: { userId_editionId: { userId, editionId: edition.id } },
    create: { userId, editionId: edition.id },
    update: {},
  });
  // Novo participante entra no ranking sem alterar a evolução dos demais.
  await recalcRanking(edition.id, false);
  revalidateAll();
}

export async function rejectUser(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user && user.role !== "ADMIN") {
    await db.user.delete({ where: { id: userId } });
  }
  revalidateAll();
}

export async function removeUser(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user && user.role !== "ADMIN") {
    await db.user.delete({ where: { id: userId } });
    const edition = await activeEdition();
    await recalcRanking(edition.id, false);
  }
  revalidateAll();
}

// Redefine a senha de um participante que esqueceu a sua.
// Gera uma senha temporária e a exibe ao admin, que repassa ao participante.
export async function resetPassword(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/admin");

  const temp = String(Math.floor(100000 + Math.random() * 900000));
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(temp, 10) },
  });
  redirect(`/admin?ok=${encodeURIComponent(`Nova senha de ${user.name} (@${user.username}): ${temp}`)}`);
}

// ---------- Jogos ----------

function parseMatchForm(formData: FormData) {
  const teamA = String(formData.get("teamA") ?? "");
  const teamB = String(formData.get("teamB") ?? "");
  const kickoffRaw = String(formData.get("kickoff") ?? "");
  const phase = String(formData.get("phase") ?? "");

  if (!teamA || !teamB) throw new Error("Selecione as duas seleções.");
  if (teamA === teamB) throw new Error("As seleções devem ser diferentes.");
  // Jogos sem nenhuma das seleções do bolão são permitidos:
  // entram apenas na Agenda, sem palpites nem pontuação.
  if (!(PHASES as readonly string[]).includes(phase)) throw new Error("Fase inválida.");
  const kickoff = parseParisDateTime(kickoffRaw);
  if (isNaN(kickoff.getTime())) throw new Error("Data e horário inválidos.");

  return { teamA, teamB, kickoff, phase };
}

export async function createMatch(formData: FormData) {
  await requireAdmin();
  const edition = await activeEdition();
  let data;
  try {
    data = parseMatchForm(formData);
  } catch (e) {
    redirect(`/admin/jogos?erro=${encodeURIComponent((e as Error).message)}`);
  }
  await db.match.create({ data: { ...data, editionId: edition.id } });
  revalidateAll();
  redirect("/admin/jogos?ok=Jogo criado com sucesso.");
}

export async function updateMatch(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId"));
  let data;
  try {
    data = parseMatchForm(formData);
  } catch (e) {
    redirect(`/admin/jogos?erro=${encodeURIComponent((e as Error).message)}`);
  }
  await db.match.update({ where: { id: matchId }, data });
  revalidateAll();
  redirect("/admin/jogos?ok=Jogo atualizado.");
}

export async function deleteMatch(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId"));
  const match = await db.match.findUnique({ where: { id: matchId } });
  if (match) {
    await db.match.delete({ where: { id: matchId } });
    // Se o jogo já tinha resultado, os pontos dele saem do ranking.
    if (match.scoreA !== null) await recalcRanking(match.editionId, false);
  }
  revalidateAll();
  redirect("/admin/jogos?ok=Jogo excluído.");
}

// Controle de liberação de palpites por jogo.
// AUTO = abre sozinho na janela automática; OPEN/CLOSED = forçado pelo admin.
export async function setMatchPredictions(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId"));
  const mode = String(formData.get("mode") ?? "AUTO");
  if (!["AUTO", "OPEN", "CLOSED"].includes(mode)) redirect("/admin/jogos");

  await db.match.update({
    where: { id: matchId },
    data: { predictionsOverride: mode === "AUTO" ? null : mode },
  });
  revalidateAll();
  redirect("/admin/jogos?ok=Liberação de palpites atualizada.");
}

// ---------- Resultados ----------

// Controle manual da trava do Chute do Campeão.
// AUTO = trava sozinho quando o primeiro jogo de mata-mata começar.
export async function setChampionLock(formData: FormData) {
  await requireAdmin();
  const edition = await activeEdition();
  const mode = String(formData.get("mode") ?? "AUTO");
  if (!["AUTO", "LOCKED", "UNLOCKED"].includes(mode)) redirect("/admin/resultados");

  await db.edition.update({
    where: { id: edition.id },
    data: { championLockOverride: mode === "AUTO" ? null : mode },
  });
  revalidateAll();
  const msg =
    mode === "LOCKED"
      ? "Chutes do campeão travados."
      : mode === "UNLOCKED"
        ? "Chutes do campeão liberados."
        : "Trava automática ativada (trava no 1º jogo do mata-mata).";
  redirect(`/admin/resultados?ok=${encodeURIComponent(msg)}`);
}

// Define (ou corrige) a seleção campeã da edição.
// Quem acertou o Chute do Campeão ganha os 10 pontos no recálculo.
export async function setChampion(formData: FormData) {
  await requireAdmin();
  const edition = await activeEdition();
  const code = String(formData.get("championTeam") ?? "");

  if (code !== "" && !TEAMS.some((t) => t.code === code)) {
    redirect(`/admin/resultados?erro=${encodeURIComponent("Seleção inválida.")}`);
  }

  await db.edition.update({
    where: { id: edition.id },
    data: { championTeam: code === "" ? null : code },
  });
  await recalcRanking(edition.id);
  revalidateAll();
  redirect(
    `/admin/resultados?ok=${encodeURIComponent(
      code === "" ? "Campeã removida. Ranking recalculado." : "Campeã definida! Ranking recalculado com os bônus de 10 pontos."
    )}`
  );
}

export async function saveResult(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId"));
  const scoreA = Number(formData.get("scoreA"));
  const scoreB = Number(formData.get("scoreB"));

  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
    redirect(`/admin/resultados?erro=${encodeURIComponent("Placar inválido.")}`);
  }

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) redirect("/admin/resultados");
  if (new Date() < match.kickoff) {
    redirect(`/admin/resultados?erro=${encodeURIComponent("O jogo ainda não começou.")}`);
  }

  await db.match.update({ where: { id: matchId }, data: { scoreA, scoreB } });
  await applyResult(matchId, match.editionId);
  revalidateAll();
  const msg = isTracked(match.teamA) || isTracked(match.teamB)
    ? "Resultado salvo. Pontuações e ranking atualizados."
    : "Placar salvo na Agenda (jogo não pontua no bolão).";
  redirect(`/admin/resultados?ok=${encodeURIComponent(msg)}`);
}
