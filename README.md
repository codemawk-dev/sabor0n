# SaborOn

SaborOn é uma plataforma para restaurantes que combina storefront, pedidos online, painel administrativo e gestão de caixa (PDV) em uma mesma base. O projeto é construído com Next.js App Router, Supabase e Drizzle ORM.

## Visão geral

- Frontend público para cardápio, checkout e acompanhamento de pedido
- Admin para restaurantes com categorias, produtos, pedidos e configurações
- Módulo de caixa com abertura/fechamento e movimentações
- Multi-tenant por restaurante via slug único
- Persistência com PostgreSQL e autenticação/Realtime via Supabase

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth + Realtime + Postgres
- Drizzle ORM
- Zod para validação
- shadcn/ui + Radix UI

## Começando

### Pré-requisitos

- Node.js 20+
- Docker Desktop ativo para o ambiente local do Supabase
- npm

### Fluxo local

```bash
npm install
npm run supabase:start
npm run dev
```

A aplicação fica em `http://localhost:3000` e o Supabase Studio local fica em `http://localhost:54323`.

### Scripts úteis

```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
npm run supabase:start
npm run supabase:stop
npm run supabase:reset
```

## Estrutura principal

- `src/app/` — rotas do App Router, incluindo storefront e painel administrativo
- `src/actions/` — server actions para criar/editar dados
- `src/components/` — UI compartilhada, storefront e admin
- `src/db/schema.ts` — schema principal do banco em Drizzle
- `src/validators/` — validações com Zod
- `drizzle/` — migrations versionadas
- `docs/AMBIENTES.md` — guia prático para ambientes, Docker e Supabase

## Convenções importantes

- Valores monetários devem ser armazenados em centavos como inteiros.
- Alterações no banco passam por schema + migration versionada; não edite o banco manualmente no painel.
- Use server actions para mutações e validações com Zod antes de persistir.
- Siga o padrão do projeto para separar storefront e admin em layout e componentes distintos.

## Documentação relevante

- [docs/AMBIENTES.md](docs/AMBIENTES.md) — setup de desenvolvimento, Supabase local e migrações
- [src/db/schema.ts](src/db/schema.ts) — base de dados do produto
- [src/validators/index.ts](src/validators/index.ts) — contratos de entrada de dados

## Observações

Este repositório contém uma configuração específica para o fluxo de desenvolvimento local com Supabase CLI e Docker. Para qualquer mudança de banco, siga o guia em [docs/AMBIENTES.md](docs/AMBIENTES.md) e prefira migrations versionadas em [drizzle/](drizzle/).
# sabor0n
