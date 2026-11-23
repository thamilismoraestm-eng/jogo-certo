import "server-only";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("A variável DATABASE_URL não está configurada.");
}

// Reutilize esta conexão ORM somente em código executado no servidor.
export const db = drizzle(databaseUrl);
