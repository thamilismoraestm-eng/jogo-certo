import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { authSchema } from "@/lib/auth-schema";
import { db } from "@/lib/db";

export const auth = betterAuth({
  appName: "Jogo Certo",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      tipoUsuario: {
        type: ["aluno", "professor"],
        required: true,
      },
    },
  },
});
