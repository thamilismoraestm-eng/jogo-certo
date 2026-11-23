try {
  const [{ db }, { sql }] = await Promise.all([
    import("../src/lib/db.ts"),
    import("drizzle-orm"),
  ]);
  const result = await db.execute(sql`SELECT 1 AS connected`);

  if (result.rows[0]?.connected !== 1) {
    throw new Error("A consulta retornou um resultado inesperado.");
  }

  const tables = await db.execute(sql`
    SELECT
      to_regclass('public.grupo') AS grupo,
      to_regclass('public.membro_grupo') AS membro_grupo
  `);
  if (!tables.rows[0]?.grupo || !tables.rows[0]?.membro_grupo) {
    throw new Error("As tabelas de grupos não foram encontradas no banco.");
  }

  console.log("Neon conectado: SELECT 1 retornou 1; grupo e membro_grupo existem.");
} catch (error) {
  const reason = error instanceof Error ? error.cause ?? error : error;
  const message =
    reason instanceof Error ? reason.message : "Erro desconhecido.";
  const safeMessage = message
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[URL do banco removida]")
    .replaceAll(process.env.DATABASE_URL ?? "\0", "[URL do banco removida]");

  console.error(
    `Não foi possível comprovar a conexão: ${safeMessage}`,
  );
  process.exitCode = 1;
}
