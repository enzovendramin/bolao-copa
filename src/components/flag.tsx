import { flagUrl, teamName } from "@/lib/teams";

// Bandeira como imagem — consistente em todos os dispositivos.
// size = largura em pixels.
export function Flag({ code, size = 28 }: { code: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl(code)}
      alt={`Bandeira: ${teamName(code)}`}
      width={size}
      style={{ width: size, height: "auto" }}
      className="inline-block shrink-0 rounded-[3px] border border-slate-200 align-[-2px] shadow-sm"
      loading="lazy"
    />
  );
}
