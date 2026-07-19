"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition } from "@/lib/queries";

// Salva (ou atualiza) o feedback final do participante: o que gostou e o que
// melhoraria. Uma resposta por participante por edição.
export async function saveFeedback(formData: FormData) {
  const user = await requireApprovedUser();
  const edition = await getActiveEdition();
  if (!edition) redirect("/inicio");

  const gostou = String(formData.get("gostou") ?? "").trim().slice(0, 1000);
  const melhoraria = String(formData.get("melhoraria") ?? "").trim().slice(0, 1000);

  await db.feedback.upsert({
    where: { userId_editionId: { userId: user.id, editionId: edition.id } },
    create: { userId: user.id, editionId: edition.id, gostou, melhoraria },
    update: { gostou, melhoraria },
  });

  revalidatePath("/feedback");
  redirect("/feedback?enviado=1");
}
