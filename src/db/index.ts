import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Em dev, o hot-reload do Next reavalia este módulo a cada mudança; sem o
// cache em globalThis, cada reload criaria um pool novo sem fechar o antigo
// e as conexões do Postgres esgotariam. prepare: false é exigido pelo
// pooler do Supabase.
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL!, { prepare: false, max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
