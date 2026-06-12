# Plano de Deploy — Club Brésil Bolão da Copa

## Arquitetura de produção (recomendada)

| Peça | Serviço | Custo |
|---|---|---|
| Aplicação (site) | **Vercel** (plano Hobby) | R$ 0 |
| Banco de dados | **Neon** (PostgreSQL, plano Free) | R$ 0 |
| Código-fonte | **GitHub** (repositório privado) | R$ 0 |

Por que assim: a Vercel é a criadora do Next.js (encaixe perfeito, HTTPS e CDN
automáticos), e o SQLite local não funciona em ambiente serverless — em
produção usamos PostgreSQL no Neon. A troca é de 1 linha no Prisma.

## Pré-requisitos (contas gratuitas — login com Google funciona)

1. Conta no **GitHub** (github.com)
2. Conta na **Vercel** (vercel.com) — conectar com o GitHub
3. Conta no **Neon** (neon.tech)

## Passo a passo do deploy

### 1. Preparar o código (Claude faz)
- [ ] Trocar `provider = "sqlite"` por `postgresql` em `prisma/schema.prisma`
- [ ] Gerar `AUTH_SECRET` forte (ex.: `openssl rand -hex 32`)
- [ ] `git init` + commit + push para o repositório no GitHub

### 2. Criar o banco (usuário clica, Claude orienta)
- [ ] Criar projeto no Neon → copiar a `DATABASE_URL` (connection string)
- [ ] Rodar `prisma db push` + `db:seed` + `seed-copa-2026` apontando para o Neon

### 3. Publicar (usuário clica, Claude orienta)
- [ ] Na Vercel: "Add New Project" → importar o repositório do GitHub
- [ ] Configurar as variáveis de ambiente: `DATABASE_URL` e `AUTH_SECRET`
- [ ] Deploy → o site nasce em `<nome>.vercel.app`

### 4. Checklist pós-deploy (antes de divulgar o link)
- [ ] Entrar como `admin` / `admin123` e **trocar a senha imediatamente** (botão 🔑)
- [ ] NÃO rodar seed-demo em produção (usuários de teste ficam só no computador local)
- [ ] Lançar os resultados dos jogos que já aconteceram (Agenda fica fiel)
- [ ] Conferir pódio/ranking/palpites no celular
- [ ] Enviar o link no grupo 🎉

## Como funcionam as atualizações depois do lançamento

O fluxo é: **mexemos aqui no seu computador → testamos localmente → publicamos**.

1. **Desenvolvimento local** continua igual a hoje: alteramos o código e testamos
   em `localhost:3000` com o banco local (SQLite) — o site no ar não é afetado
   em nada enquanto isso.
2. **Publicar**: `git push` para o GitHub. A Vercel detecta sozinha e publica a
   nova versão em ~2 minutos, **sem derrubar o site e sem tocar nos dados**
   (o banco vive separado, no Neon).
3. **Testar em uma cópia antes (opcional)**: se a mudança for arriscada, fazemos
   o push em um *branch* — a Vercel cria automaticamente uma **URL de preview**
   (cópia independente do site) para conferir antes de mandar para o site oficial.
   Para mudanças de texto/visual, isso normalmente é desnecessário.

Regra de bolso: mudou só aparência/texto → push direto. Mudou regra de pontos ou
banco → testamos local + preview antes.

## Segurança implementada

- Senhas com hash bcrypt; sessão JWT em cookie httpOnly/SameSite (30 dias)
- Limite de tentativas de login (10 por 15 min por IP+usuário)
- Cabeçalhos de segurança (X-Frame-Options, nosniff, Referrer-Policy)
- Toda validação de permissão refeita no servidor em cada ação
- Página pública sem dados privados; tela 🔑 para trocar a própria senha
- HTTPS automático na Vercel

## Backup

O Neon mantém histórico/point-in-time recovery no plano free (últimas 24h).
Para garantia extra, exportar o banco 1× por semana:
`pg_dump $DATABASE_URL > backup.sql` (Claude pode automatizar se desejado).
