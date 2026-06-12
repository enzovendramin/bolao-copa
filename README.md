# 🏆 Club Brésil – Bolão da Copa

Plataforma privada de bolão da Copa do Mundo 2026 para ~20–50 participantes.
Mobile-first, em português do Brasil, pensada para usuários não técnicos.

## Como rodar

```bash
npm install                          # instala dependências (gera o Prisma Client)
npx prisma db push                   # cria o banco SQLite (prisma/dev.db)
npm run db:seed                      # cria edição 2026 e o admin
npx tsx scripts/seed-copa-2026.ts    # carrega a tabela real da fase de grupos (72 jogos)
npm run dev                          # http://localhost:3000
```

Todos os horários do sistema são exibidos no **horário da França (Europe/Paris)**,
onde mora a maioria dos participantes. Datas armazenadas em UTC.

**Acesso do administrador (seed):** usuário `admin` / senha `admin123`
⚠️ Troque a senha do admin e o `AUTH_SECRET` do `.env` antes de ir para produção.

---

## Arquitetura

### Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Um único projeto para frontend + backend (Server Components + Server Actions). Sem API separada para manter, deploy de um artefato só. |
| Linguagem | **TypeScript** | Segurança de tipos nas regras de pontuação e nos formulários. |
| Estilo | **Tailwind CSS 4** | Design system consistente sem dependência de bibliotecas de componentes pesadas. |
| Banco | **SQLite via Prisma** | Para 20–50 usuários é mais que suficiente, custo zero, backup = copiar um arquivo. O Prisma permite trocar para PostgreSQL mudando 2 linhas se o grupo crescer. |
| Autenticação | **Cookie JWT próprio (jose + bcryptjs)** | Sem serviços externos, sem custo, sem complexidade de OAuth. Login por nome de usuário + senha (sem e-mail — não há envio de e-mails no sistema; quem esquecer a senha pede reset ao admin). Cookie httpOnly + SameSite=Lax. |
| Bandeiras | **Emoji nativo** | Zero assets para manter, renderização perfeita em celulares (onde o app será mais usado). |

### Decisões importantes (e justificativas)

0. **Liberação de palpites em ondas.**
   Para a tela de palpites não ficar lotada, cada jogo abre para palpites
   automaticamente **7 dias antes** da partida. O admin pode forçar
   "Liberar agora" ou "Bloquear" por jogo no painel (Admin → Jogos).

1. **Status do jogo é derivado, nunca armazenado.**
   `ABERTO` (antes do horário) → `FECHADO` (após o horário) → `FINALIZADO` (com placar oficial).
   Isso garante o **bloqueio automático de palpites exatamente no horário de início** sem nenhum cron job, fila ou ação do administrador — o servidor simplesmente compara `agora >= kickoff` em toda leitura e escrita. Menos partes móveis = menos bugs e menos custo.

2. **Server Actions em vez de API REST.**
   Todos os formulários (login, palpites, admin) enviam direto para funções do servidor. Quase zero JavaScript no cliente (~100 kB no total), o que torna o app rápido em celulares com conexão ruim. A validação de segurança acontece sempre no servidor (`requireApprovedUser`, `requireAdmin`).

3. **Pontuação calculada e materializada no momento do resultado.**
   Regras: placar exato = **5 pts** · acertou vencedor/empate = **2 pts** · errou = **0**.
   Há ainda o **Chute do Campeão**: cada participante aposta em qual seleção (qualquer uma)
   será campeã; acertar vale **10 pts**, creditados quando o admin define a campeã no
   painel de Resultados. Por padrão o chute é editável durante toda a fase de grupos e
   trava automaticamente quando o primeiro jogo de mata-mata cadastrado começa; o admin
   pode forçar travar/liberar a qualquer momento no painel de Resultados.
   Quando o admin salva um placar oficial: (a) cada palpite daquele jogo é pontuado e gravado; (b) os totais por participante são recalculados; (c) as posições são reatribuídas guardando a posição anterior para a evolução (⬆ ⬇ ➖). Leituras (ranking, pódio) ficam triviais e rápidas.

4. **Empates sem desempate (classificação por competição).**
   Mesma pontuação ⇒ mesma posição: `1º, 1º, 3º` (o 2º é pulado), exatamente como a especificação pede.

5. **Visibilidade de palpites controlada no servidor.**
   Participantes só veem palpites alheios em páginas que filtram `kickoff <= agora` (Histórico). O admin tem uma tela própria que mostra tudo, inclusive de jogos abertos.

6. **Múltiplas edições desde o schema.**
   `Edition` ↔ `Participation` ↔ `Match` já separam tudo por edição. Hoje só existe "Copa do Mundo 2026" (ativa); criar 2030 será inserir uma linha e ativá-la.

7. **Jogos considerados + Agenda.**
   Jogos com ao menos uma seleção do bolão (🇧🇷 🇦🇷 🇫🇷 🇪🇸 🇩🇪 🇵🇹) valem palpite e pontos.
   O admin também pode cadastrar **qualquer outro jogo da Copa** — esses entram apenas na
   aba **Agenda** (consulta dia a dia, com horários e placares), sem palpites nem pontuação.

8. **Mata-mata / pênaltis.**
   O admin registra somente o placar do tempo regulamentar + prorrogação. Pênaltis não existem no modelo — empate continua empate, como a regra exige.

### Modelagem de dados

```
User (nome, usuário, senha-hash, role: ADMIN|PARTICIPANT, status: PENDING|APPROVED)
 └─ Participation (por edição: pontos, exatos, acertos, posição, posição anterior)
 └─ Prediction (palpite: gols A/B + pontos materializados; única por usuário+jogo)
Edition (Copa 2026, ativa)
 └─ Match (seleção A/B em código ISO, data/hora UTC, fase, placar oficial nullable)
```

### Estrutura de telas e fluxos

```
/                  Página pública (sem login): pódio, ranking, resultados
/entrar /cadastro  Autenticação
/aguardando        Conta criada, aguardando aprovação do admin
/inicio            Próximo jogo · palpites pendentes · pódio · ranking resumido
/palpites          Todos os jogos abertos, "Salvar todos os palpites"
/ranking           Pódio + tabela completa (pos, nome, pts, 🎯, ✔, evolução)
/historico         Jogos encerrados: resultado, seu palpite, pontos, palpites de todos
/agenda            Todos os jogos cadastrados, dia a dia (inclusive os sem palpite)
/admin             Aprovar/rejeitar/remover participantes
/admin/jogos       Criar/editar/excluir jogos
/admin/resultados  Lançar placar oficial (recalcula tudo automaticamente)
/admin/palpites    Todos os palpites de todos
```

**Fluxo do participante:** cria conta → aguarda aprovação → recebe acesso → preenche placares na tela de palpites (inputs grandes, teclado numérico, um botão salva tudo) → acompanha pódio/ranking.

**Fluxo do administrador:** aprova solicitações → cadastra jogos → após cada partida lança o placar → pontuação, ranking e evolução são recalculados na hora.

### Wireframe conceitual (mobile)

```
┌──────────────────────────┐   ┌──────────────────────────┐
│ 🏆 Club Brésil      Sair │   │ Meus palpites            │
│──────────────────────────│   │ ┌──────────────────────┐ │
│ Olá, João! Você está em  │   │ │ Grupos · 13/06 19:00 │ │
│ 2º lugar com 12 pontos.  │   │ │  🇧🇷      ×      🇲🇦  │ │
│ ┌──────────────────────┐ │   │ │ Brasil [2] [0] Marr. │ │
│ │ PRÓXIMO JOGO         │ │   │ └──────────────────────┘ │
│ │   🇧🇷    ×    🇲🇦     │ │   │ ┌──────────────────────┐ │
│ │ sáb 13/06 às 19:00   │ │   │ │ ... mais jogos ...   │ │
│ └──────────────────────┘ │   │ └──────────────────────┘ │
│ ⚠ 3 palpites pendentes → │   │ ┌──────────────────────┐ │
│ ┌─────── PÓDIO ────────┐ │   │ │ Salvar todos os      │ │
│ │   🥈   🥇   🥉       │ │   │ │     palpites         │ │
│ │  Ana  João  Bia      │ │   │ └──────────────────────┘ │
│ └──────────────────────┘ │   │                          │
│ 🏠   ⚽   🏆   📋        │   │ 🏠   ⚽   🏆   📋        │
└──────────────────────────┘   └──────────────────────────┘
```

### Segurança

- Senhas com bcrypt (custo 10); sessão JWT assinada em cookie httpOnly.
- Middleware bloqueia rotas privadas sem sessão; layouts verificam aprovação e papel de admin no banco.
- Toda mutação revalida permissões no servidor (Server Action) — nunca confia no cliente.
- Palpites de jogos iniciados são ignorados no servidor mesmo se o formulário for forjado.
- A página pública não expõe dados privados — apenas nome e pontuação.
- Senha esquecida: o admin gera uma senha temporária no painel (botão "Nova senha").

---

## Implantação

### Opção recomendada (custo ~zero): VPS ou Fly.io/Railway com volume

SQLite precisa de disco persistente. Qualquer VPS barato (ou plano hobby do
Fly.io/Railway) roda o app inteiro:

```bash
npm run build
npm start            # porta 3000 (use um reverse proxy com HTTPS)
```

- Defina `AUTH_SECRET` forte e `DATABASE_URL="file:/dados/prod.db"` no ambiente.
- **Backup = copiar o arquivo `.db`** (um cron diário resolve).

### Opção serverless: Vercel + Postgres gerenciado (Neon/Supabase, planos gratuitos)

1. Troque o provider no `prisma/schema.prisma` para `postgresql` e aponte `DATABASE_URL` para o banco.
2. `npx prisma db push && npm run db:seed`.
3. Conecte o repositório à Vercel — deploy automático a cada push.

### Teste de lógica

`npx tsx scripts/test-logic.ts` valida pontuação, empates e evolução de posição de ponta a ponta (cria e remove dados de teste).
