# 🐳 Ambientes, Docker e Migrações — SaborOn

Como este projeto está configurado para o fluxo de Desenvolvimento local (Docker via Supabase CLI), Homologação e Produção.

> Este documento adapta o guia da equipa à configuração real do repositório. Diferenças em relação ao guia original estão marcadas com ⚠️.

---

## 1. Desenvolvimento Local (Docker + Supabase CLI)

### Pré-requisitos
- **Docker Desktop** instalado e ativo.
- ⚠️ A Supabase CLI **não pode** ser instalada com `npm i -g supabase` (o pacote bloqueia instalação global). Ela já está instalada como devDependency deste projeto — use sempre `npx supabase <comando>` ou os scripts npm abaixo.

### Fluxo diário

```bash
npm run supabase:start   # sobe Postgres, Auth, Realtime e Studio locais
npm run dev              # sobe o app em localhost:3000
npm run supabase:stop    # ao final do dia
```

- **Studio local (painel):** http://localhost:54323  ⚠️ (54321 é a URL da API, não do painel)
- **API local:** http://localhost:54321
- **Postgres local:** localhost:54322

### .env.local de desenvolvimento

Copie `.env.example` para `.env.local`. A `NEXT_PUBLIC_SUPABASE_ANON_KEY` local aparece na saída de `npx supabase status`.

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key exibida por `npx supabase status`>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

---

## 2. Estrutura de Ambientes

| Ambiente | App | Banco | Finalidade |
| :--- | :--- | :--- | :--- |
| **Desenvolvimento** | `localhost:3000` | Local (Docker, `localhost:54322`) | Novas features e testes rápidos |
| **Homologação** | Preview (Vercel) | Projeto Supabase `saboron-staging` | Validação integrada pela equipa |
| **Produção** | `saboron.com.br` | Projeto Supabase `saboron-production` | Dados reais |

**Nunca misture credenciais entre ambientes.** O `.env.local` nunca vai para o GitHub (`.gitignore` já cobre `.env*`).

---

## 3. Migrações (Drizzle)

**Regra de ouro:** nenhuma alteração de tabela é feita manualmente no painel do Supabase (local, staging ou produção). Tudo passa por migration versionada na pasta `drizzle/`.

Migrations existentes:
- `drizzle/0000_schema-inicial.sql` — todas as tabelas e enums do schema.
- `drizzle/0001_rls-e-realtime.sql` — políticas RLS, FK `restaurantes.owner_id → auth.users` e publicação Realtime da tabela `pedidos` (migration customizada).

### Fluxo para alterar o banco

```bash
# 1. Edite src/db/schema.ts
# 2. Gere a migration incremental
npm run db:generate

# 3. Aplique na sua base local (Docker)
npm run db:migrate

# 4. Popule dados de teste, se precisar
npm run db:seed
```

Para SQL que o Drizzle não gera a partir do schema (policies, triggers, publications), crie uma migration customizada:

```bash
npx drizzle-kit generate --custom --name=minha-alteracao
# edite o arquivo criado em drizzle/
```

### Aplicando em Homologação / Produção

O `db:migrate` roda contra o banco apontado por `DATABASE_URL` no `.env.local`. Para staging/produção, execute com a connection string do ambiente correspondente (na esteira de deploy ou manualmente):

```bash
DATABASE_URL="postgresql://postgres.<ref>:<senha>@...pooler.supabase.com:5432/postgres" npm run db:migrate
```

O `migrate` só aplica migrations pendentes — não apaga dados.

---

## 4. Reset do banco local

⚠️ `supabase db reset` recria o banco a partir de `supabase/migrations/` — que este projeto **não usa** (as migrations são do Drizzle, em `drizzle/`). Portanto o reset completo local é:

```bash
npm run supabase:reset   # apaga e recria o banco local vazio
npm run db:migrate       # reaplica as migrations do Drizzle
npm run db:seed          # repopula os dados de exemplo
```

---

## 5. Boas práticas

- Não versione `.env.local` (já coberto pelo `.gitignore`).
- Rode `npm run db:seed` localmente para testar com dados prontos (cria a "Pizzaria do Zé" em `/pizzaria-do-ze`).
- Para vincular o restaurante do seed ao seu usuário local: crie um usuário no Studio (Authentication) e rode no SQL Editor local:
  ```sql
  update restaurantes set owner_id = '<uuid do usuário>' where slug = 'pizzaria-do-ze';
  ```
  (ou simplesmente faça login no app e crie um restaurante novo pelo onboarding).
