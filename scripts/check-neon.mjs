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
      to_regclass('public.membro_grupo') AS membro_grupo,
      to_regclass('public.treino') AS treino,
      to_regclass('public.presenca') AS presenca,
      to_regclass('public.treino_equipamento') AS treino_equipamento,
      to_regclass('public.equipamento_levado') AS equipamento_levado
  `);
  if (!tables.rows[0]?.grupo || !tables.rows[0]?.membro_grupo || !tables.rows[0]?.treino
    || !tables.rows[0]?.presenca || !tables.rows[0]?.treino_equipamento
    || !tables.rows[0]?.equipamento_levado) {
    throw new Error("As tabelas necessárias do Jogo Certo não foram encontradas no banco.");
  }

  const cascades = await db.execute(sql`
    SELECT conname, confdeltype
    FROM pg_constraint
    WHERE conname IN (
      'membro_grupo_grupo_id_grupo_id_fk',
      'treino_grupo_id_grupo_id_fk',
      'presenca_treino_id_treino_id_fk',
      'treino_equipamento_treino_id_treino_id_fk',
      'equipamento_levado_presenca_id_presenca_id_fk',
      'equipamento_levado_treino_equipamento_id_treino_equipamento_id_fk'
    )
  `);
  if (cascades.rows.length !== 6 || cascades.rows.some((fk) => fk.confdeltype !== "c")) {
    throw new Error("As regras de exclusão em cascata não correspondem ao schema esperado.");
  }

  console.log("Neon conectado: tabelas presentes e seis relações de exclusão em cascata confirmadas.");
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
