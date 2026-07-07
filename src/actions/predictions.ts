"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { isOpenForPredictions } from "@/lib/match-status";
import { getChampionLock } from "@/lib/queries";
import { TEAMS, matchCountsForPool } from "@/lib/teams";

// Salva todos os palpites enviados de uma vez (botão "Salvar todos os palpites").
// Campos esperados: m_<matchId>_a e m_<matchId>_b.
// Jogos já iniciados são silenciosamente ignorados (bloqueio automático),
// e campos vazios não sobrescrevem palpites existentes.
export async function saveAllPredictions(formData: FormData) {
  const user = await requireApprovedUser();
  const now = new Date();

  const entries = new Map<string, { a?: string; b?: string }>();
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^m_(.+)_(a|b)$/);
    if (!m) continue;
    const e = entries.get(m[1]) ?? {};
    e[m[2] as "a" | "b"] = String(value);
    entries.set(m[1], e);
  }

  let saved = 0;
  for (const [matchId, e] of entries) {
    if (e.a === undefined || e.b === undefined || e.a === "" || e.b === "") continue;

    const a = Number(e.a);
    const b = Number(e.b);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 30 || b > 30) {
      continue;
    }

    const match = await db.match.findUnique({ where: { id: matchId } });
    if (!match || !isOpenForPredictions(match, now)) continue;
    // Jogos que não contam para o bolão (só Agenda) não recebem palpite.
    if (!matchCountsForPool(match)) continue;

    await db.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId } },
      create: { userId: user.id, matchId, scoreA: a, scoreB: b },
      update: { scoreA: a, scoreB: b },
    });
    saved++;
  }

  // Chute do Campeão: editável até o início do primeiro jogo da edição.
  const champion = formData.get("champion");
  if (champion !== null && champion !== "") {
    const code = String(champion);
    const edition = await db.edition.findFirst({ where: { isActive: true } });
    if (
      edition &&
      TEAMS.some((t) => t.code === code) &&
      !(await getChampionLock(edition.id)).locked
    ) {
      await db.participation.upsert({
        where: { userId_editionId: { userId: user.id, editionId: edition.id } },
        create: { userId: user.id, editionId: edition.id, championPick: code },
        update: { championPick: code },
      });
    }
  }

  revalidatePath("/palpites");
  revalidatePath("/inicio");
  redirect(`/palpites?salvos=${saved}`);
}
