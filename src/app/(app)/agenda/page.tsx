import Link from "next/link";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/auth";
import { getActiveEdition } from "@/lib/queries";
import { Flag } from "@/components/flag";
import { teamName, isTracked, PHASES } from "@/lib/teams";
import {
  formatTime,
  formatDate,
  parisDayKey as dayKey,
  parisDayLabel as dayLabel,
  TZ_LABEL,
} from "@/lib/dates";
import { matchStatus } from "@/lib/match-status";

export const dynamic = "force-dynamic";

type MatchRow = {
  id: string;
  teamA: string;
  teamB: string;
  kickoff: Date;
  scoreA: number | null;
  scoreB: number | null;
};

// Linha de um jogo. showDate inclui a data (usado na visão por fase, que não
// é agrupada por dia).
function JogoLinha({ m, showDate = false }: { m: MatchRow; showDate?: boolean }) {
  const status = matchStatus(m);
  const pool = isTracked(m.teamA) || isTracked(m.teamB);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="w-14 shrink-0 text-xs font-semibold leading-tight text-slate-600">
        {showDate && <>{formatDate(m.kickoff)}<br /></>}
        {formatTime(m.kickoff)}
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        <span className="truncate text-sm font-medium">{teamName(m.teamA)}</span>
        <Flag code={m.teamA} size={20} />
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold">
          {status === "FINALIZADO" ? `${m.scoreA}×${m.scoreB}` : "×"}
        </span>
        <Flag code={m.teamB} size={20} />
        <span className="truncate text-sm font-medium">{teamName(m.teamB)}</span>
      </div>
      <span
        className="w-5 shrink-0 text-center"
        title={pool ? "Vale palpite no bolão" : "Apenas consulta"}
      >
        {pool ? "⚽" : ""}
      </span>
    </div>
  );
}

function Toggle({ vista }: { vista: "dia" | "fase" }) {
  const base = "flex-1 rounded-lg py-1.5 text-center text-sm font-semibold transition";
  const on = "bg-emerald-700 text-white";
  const off = "text-slate-600";
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      <Link href="/agenda" className={`${base} ${vista === "dia" ? on : off}`}>
        Por dia
      </Link>
      <Link href="/agenda?vista=fase" className={`${base} ${vista === "fase" ? on : off}`}>
        Por fase
      </Link>
    </div>
  );
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  await requireApprovedUser();
  const edition = await getActiveEdition();
  if (!edition) return <p className="text-center text-slate-500">Nenhuma edição ativa.</p>;

  const { vista: vistaParam } = await searchParams;
  const vista: "dia" | "fase" = vistaParam === "fase" ? "fase" : "dia";
  const now = new Date();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Agenda de jogos</h1>
        <p className="text-sm text-slate-500">
          Os jogos marcados com ⚽ valem palpite no bolão.
        </p>
      </div>

      <Toggle vista={vista} />

      {vista === "dia" ? (
        <VistaPorDia editionId={edition.id} now={now} />
      ) : (
        <VistaPorFase editionId={edition.id} />
      )}

      <p className="text-xs text-slate-400">
        Exibindo no {TZ_LABEL}. {`"×"`} sem placar = jogo ainda não finalizado.
      </p>
    </div>
  );
}

// ---- Visão por dia (janela de ontem a +7 dias) ----
async function VistaPorDia({ editionId, now }: { editionId: string; now: Date }) {
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + 8);
  end.setHours(0, 0, 0, 0);

  const matches = await db.match.findMany({
    where: { editionId, kickoff: { gte: start, lt: end } },
    orderBy: { kickoff: "asc" },
  });
  const todayKey = dayKey(now);
  const days = new Map<string, typeof matches>();
  for (const m of matches) {
    const key = dayKey(m.kickoff);
    days.set(key, [...(days.get(key) ?? []), m]);
  }

  if (days.size === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Nenhum jogo cadastrado para os próximos dias.
      </p>
    );
  }

  return (
    <>
      {[...days.entries()].map(([key, dayMatches]) => {
        const isToday = key === todayKey;
        return (
          <section key={key} className="flex flex-col gap-2">
            <h2
              className={`text-sm font-bold capitalize ${
                isToday ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {isToday && "📍 Hoje · "}
              {dayLabel(dayMatches[0].kickoff)}
            </h2>
            {dayMatches.map((m) => (
              <JogoLinha key={m.id} m={m} />
            ))}
          </section>
        );
      })}
    </>
  );
}

// ---- Visão por fase (chave do mata-mata, de cima para baixo) ----
async function VistaPorFase({ editionId }: { editionId: string }) {
  const matches = await db.match.findMany({
    where: { editionId, phase: { not: "Fase de Grupos" } },
    orderBy: { kickoff: "asc" },
  });

  if (matches.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        O mata-mata ainda não começou. Quando os confrontos forem definidos, a
        chave aparece aqui.
      </p>
    );
  }

  // Agrupa por fase, na ordem oficial da competição.
  const knockoutPhases = PHASES.filter((p) => p !== "Fase de Grupos");
  return (
    <>
      {knockoutPhases.map((fase) => {
        const jogos = matches.filter((m) => m.phase === fase);
        if (jogos.length === 0) return null;
        return (
          <section key={fase} className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
              {fase}
              <span className="h-px flex-1 bg-emerald-100" />
            </h2>
            {jogos.map((m) => (
              <JogoLinha key={m.id} m={m} showDate />
            ))}
          </section>
        );
      })}
    </>
  );
}
