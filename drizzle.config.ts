import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit não carrega .env.local sozinho (padrão do Next.js)
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
