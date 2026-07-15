# AGENTS.md

Este repositório é um app de restaurante em Next.js com App Router, Supabase e Drizzle ORM. Foque em mudanças consistentes com o padrão já usado aqui.

## Diretrizes rápidas

- Use o App Router em `src/app/` e mantenha o storefront e o admin separados por área.
- Prefira server actions em `src/actions/` para mutações de dados.
- Valide entradas com `zod` em `src/validators/index.ts` antes de persistir.
- Mantenha valores monetários em centavos (`integer`) no banco e nos formulários.
- O schema principal fica em `src/db/schema.ts`; migrações versionadas em `drizzle/`.
- UI de admin está em `src/components/admin/`; UI pública em `src/components/storefront/`.

## Fluxo de desenvolvimento

Use o guia em [docs/AMBIENTES.md](docs/AMBIENTES.md) para setup local e banco. Em resumo:

```bash
npm install
npm run supabase:start
npm run dev
```

Quando precisar trocar estrutura de banco:

1. edite `src/db/schema.ts`
2. gere migration com `npm run db:generate`
3. aplique com `npm run db:migrate`
4. use `npm run db:seed` para dados de exemplo, se necessário

## Padrões do códigobase

- `src/app/[slug]/` é a loja pública por restaurante.
- `src/app/admin/` é o painel administrativo.
- `src/lib/` guarda utilidades, integrações e helpers compartilhados.
- `src/stores/` contém Zustand para estado cliente leve.

## Observações importantes

- O projeto usa Supabase local via Docker e `npx supabase`; não instale a CLI globalmente.
- Não use o painel do Supabase para criar/alterar schema quando a mudança é persistente; vá por migration.
- Antes de escrever código novo, leia a documentação relevante em [docs/AMBIENTES.md](docs/AMBIENTES.md) e o schema em [src/db/schema.ts](src/db/schema.ts).

## Nota sobre Next.js

Atenção: este workspace usa uma versão de Next.js que não deve ser tratada como a referência genérica do create-next-app. Se uma mudança parecer incompatível com o App Router padrão, consulte a documentação local da instalação antes de aplicar uma correção ampla.
