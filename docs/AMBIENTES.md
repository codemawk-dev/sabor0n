# 🌐 Matriz de Ambientes — SaborOn

Para garantir a estabilidade do sistema, o SaborOn opera com isolamento total entre desenvolvimento, homologação e produção. **Nunca misture credenciais entre ambientes.**

| Ambiente            | Branch            | URL de Acesso                                                        | Projeto Supabase       | Região AWS     | Finalidade                          |
| :------------------ | :---------------- | :------------------------------------------------------------------- | :--------------------- | :------------- | :---------------------------------- |
| **Produção**        | `main`            | [sabor0n.vercel.app](https://sabor0n.vercel.app)                     | `jmvgtdvedlubbhgcmuea` | `us-east-2`    | Aplicação live para clientes reais. |
| **Homologação**     | `homolog`         | [homolog-sabor0n.vercel.app](https://homolog-sabor0n.vercel.app)     | `xfjmqszvhqadjmzwxyil` | `ca-central-1` | Validação de features com o time.   |
| **Desenvolvimento** | `develop` / local | `localhost:3000`                                                     | Docker local           | Máquina local  | Criação de código e testes destrutivos. |

### Como o deploy funciona (Vercel)

- Tudo roda em **um único projeto Vercel**: `sabor0n` (conta `codemawk`).
- Push na `main` → deploy de **Produção** (`sabor0n.vercel.app`).
- Push na `homolog` → deploy de **Preview** servido em `homolog-sabor0n.vercel.app` (domínio amarrado à branch).
- Push na `develop` ou em qualquer outra branch → **não gera deploy** (Ignored Build Step do projeto só builda `main` e `homolog`).
- As variáveis de ambiente vivem na Vercel: escopo **Production** = banco de produção; escopo **Preview** = banco de homologação.

### ⚠️ Connection strings: use sempre o pooler

A conexão direta (`db.<ref>.supabase.co:5432`) é **IPv6-only e NÃO funciona na Vercel** (nem na maioria das redes locais). Use o **Supavisor pooler**:

| Uso                        | Formato                                                                     | Porta                 |
| :------------------------- | :-------------------------------------------------------------------------- | :-------------------- |
| Runtime na Vercel          | `postgresql://postgres.<ref>:<senha>@<host-pooler>:6543/postgres`           | `6543` (transaction)  |
| Migrations (`db:migrate`)  | `postgresql://postgres.<ref>:<senha>@<host-pooler>:5432/postgres`           | `5432` (session)      |

Hosts do pooler (atenção: o prefixo `aws-N` varia por projeto):

- Homologação: `aws-0-ca-central-1.pooler.supabase.com`
- Produção: `aws-1-us-east-2.pooler.supabase.com`

As senhas ficam no dashboard do Supabase (Settings → Database) — nunca neste repositório.

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

- **Studio local (painel):** http://localhost:54323 ⚠️ (54321 é a URL da API, não do painel)
- **API local:** http://localhost:54321
- **Postgres local:** localhost:54322

### .env.local de desenvolvimento

Copie `.env.example` para `.env.local`. A `NEXT_PUBLIC_SUPABASE_ANON_KEY` local aparece na saída de `npx supabase status`.

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key exibida por `npx supabase status`>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

O `.env.local` nunca vai para o GitHub (`.gitignore` já cobre `.env*`).

---

## 2. Migrações (Drizzle)

**Regra de ouro:** nenhuma alteração de tabela é feita manualmente no painel do Supabase (local, homolog ou produção). Tudo passa por migration versionada na pasta `drizzle/`.

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

### 🛠️ Como aplicar migrations na nuvem

As migrations **não rodam sozinhas** no deploy da Vercel. Sempre que houver uma nova migration, o responsável pelo deploy deve aplicá-la manualmente no banco correspondente **antes** de liberar a versão, usando o pooler em modo session (porta 5432):

```bash
# Homologação
DATABASE_URL="postgresql://postgres.xfjmqszvhqadjmzwxyil:<senha>@aws-0-ca-central-1.pooler.supabase.com:5432/postgres" npm run db:migrate

# Produção
DATABASE_URL="postgresql://postgres.jmvgtdvedlubbhgcmuea:<senha>@aws-1-us-east-2.pooler.supabase.com:5432/postgres" npm run db:migrate
```

O `migrate` só aplica migrations pendentes — não apaga dados.

---

## 3. 🔒 Autenticação — configuração pendente (setup único)

Caso o fluxo de Login/OAuth ou Magic Links seja ativado, é obrigatório configurar as URLs de redirecionamento no painel de cada projeto Supabase (**Authentication → URL Configuration**):

- **Homologação** (`xfjmqszvhqadjmzwxyil`): Site URL = `https://homolog-sabor0n.vercel.app`
- **Produção** (`jmvgtdvedlubbhgcmuea`): Site URL = `https://sabor0n.vercel.app`

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
