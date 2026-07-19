import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// O middleware só verifica se há sessão válida (rápido, roda no edge).
// Verificações de papel (admin) e status (aprovado) são feitas nos layouts,
// pois exigem consulta ao banco.
const PROTECTED = ["/inicio", "/palpites", "/ranking", "/historico", "/agenda", "/retrospectiva", "/cerimonia", "/feedback", "/senha", "/admin", "/aguardando"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("session")?.value;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret"));
      return NextResponse.next();
    } catch {
      // token inválido/expirado — segue para o redirect abaixo
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = "/entrar";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/inicio/:path*", "/palpites/:path*", "/ranking/:path*", "/historico/:path*", "/agenda/:path*", "/retrospectiva", "/cerimonia", "/feedback", "/senha", "/admin/:path*", "/aguardando"],
};
