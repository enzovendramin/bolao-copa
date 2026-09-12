# 🏆 Club Brésil – Bolão da Copa

> Documentação original em português. Versão em inglês: [README.md](../README.md).

Plataforma privada de bolão da Copa do Mundo 2026 para ~20–50 participantes.
Mobile-first, em português do Brasil, pensada para usuários não técnicos.

## Como rodar

```bash
npm install                          # instala dependências (gera o Prisma Client)
npx prisma db push                   # cria o schema no Postgres apontado por DATABASE_URL
npm run db:seed                      # cria edição 2026 e o admin
npx tsx scripts/seed-copa-2026.ts    # carrega a tabela real da fase de grupos (72 jogos)
npm run dev                          # http://localhost:3000
```

Horários são armazenados em UTC e exibidos/inseridos no fuso definido por
`APP_TZ` (padrão `Europe/Paris`; a instância do Brasil usa `America/Sao_Paulo`).

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
| Banco | **PostgreSQL (Neon) via Prisma** | Postgres gerenciado com conexão pooled para o app e direta para migrações. SQLite foi usado só no protótipo inicial. |
| Autenticação | **Cookie JWT próprio (jose + bcryptjs)** | Sem serviços externos, sem custo, sem complexidade de OAuth. Login por nome de usuário + senha (sem e-mail — não há envio de e-mails no sistema; quem esquecer a senha pede reset ao admin). Cookie httpOnly + SameSite=Lax. |
| Bandeiras | **Imagens (flagcdn.com)** | Emojis de bandeira não renderizam no Windows; imagens garantem o mesmo visual em qualquer dispositivo. |

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
   Regras (padrão, configuráveis por `SCORE_EXACT` / `SCORE_OUTCOME` / `SCORE_CHAMPION`):
   placar exato = **5 pts** · acertou vencedor/empate = **2 pts** · errou = **0**.
   Há ainda o **Chute do Campeão**: cada participante aposta em qual seleção (qualquer uma)
   será campeã; acertar vale **10 pts**, creditados quando o admin define a campeã no
   painel de Resultados. Por padrão o chute é editável durante toda a fase de grupos e
   trava automaticamente quando o primeiro jogo de mata-mata cadastrado começa; o admin
   pode forçar travar/liberar a qualquer momento no painel de Resultados.
   Quando o admin salva um placar oficial: (a) cada palpite daquele jogo é pontuado e gravado; (b) os totais por participante são recalculados; (c) as posições são reatribuídas guardando a posição anterior para a evolução (⬆ ⬇ ➖). Leituras (ranking, pódio) ficam triviais e rápidas.

4. **Desempate em cascata; empate total ⇒ classificação por competição.**
   Ordem: pontos → placares exatos → acertos de resultado. Quem empata em tudo
   divide a posição (`1º, 1º, 3º`, o 2º é pulado).

5. **Visibilidade de palpites controlada no servidor.**
   Participantes só veem palpites alheios em páginas que filtram `kickoff <= agora` (Histórico). O admin tem uma tela própria que mostra tudo, inclusive de jogos abertos.

6. **Múltiplas edições desde o schema.**
   `Edition` ↔ `Participation` ↔ `Match` já separam tudo por edição. Hoje só existe "Copa do Mundo 2026" (ativa); criar 2030 será inserir uma linha e ativá-la.

7. **Jogos considerados + Agenda.**
   Na fase de grupos, valem palpite os jogos com ao menos uma seleção do bolão
   (🇧🇷 🇦🇷 🇫🇷 🇪🇸 🇩🇪 🇵🇹). A partir da fase definida em `OPEN_FROM_PHASE`
   (padrão Oitavas), **todo** jogo do mata-mata vale palpite. Os demais jogos
   entram só na aba **Agenda** (visão por dia ou por fase/chave).

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
/agenda            Todos os jogos cadastrados, por dia ou por fase (chave)
/retrospectiva     Prêmios e curiosidades calculados ao final da Copa
/cerimonia         Pódio com revelação progressiva
/feedback          Formulário de feedback do participante
/senha             Trocar a própria senha
/admin             Aprovar/rejeitar/remover participantes, resetar senhas
/admin/jogos       Criar/editar/excluir jogos, forçar abertura/fechamento de palpites
/admin/resultados  Lançar placar oficial e campeã (recalcula tudo automaticamente)
/admin/palpites    Todos os palpites de todos
/admin/feedback    Feedback recebido
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

Ver [DEPLOY.md](../DEPLOY.md) (Vercel + Neon, duas instâncias, variáveis de ambiente,
processo de release).

### Testes

- `npx tsx scripts/test-rotina.ts` — fuso horário, janela de palpites, travas (em memória, sem banco).
- `npx tsx scripts/test-retro.ts` — prêmios e curiosidades da retrospectiva (funções puras).
- `npx tsx scripts/test-logic.ts` — pontuação, desempate e evolução de posição de ponta a ponta (cria e remove dados de teste; **só em banco de desenvolvimento**).
