import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error("DATABASE_URL_UNPOOLED é necessária para as migrações.");
}

export default defineConfig({
  // O schema agregado mantém as tabelas do Better Auth e inclui as do app.
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED,
  },
});
