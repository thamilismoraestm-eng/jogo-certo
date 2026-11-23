export type RespostaVisivel = {
  usuarioId: string;
  resposta: "vou" | "nao_vou";
};

export function visibilidadePresencas<T extends RespostaVisivel>(
  respostas: T[],
  visualizadorId: string,
  criadorId: string,
  resultadoPublicado: boolean,
) {
  const ehCriador = visualizadorId === criadorId;
  const minhaResposta = respostas.find((resposta) => resposta.usuarioId === visualizadorId) ?? null;
  const podeVerResumo = ehCriador || resultadoPublicado;

  return {
    minhaResposta,
    respostasVisiveis: ehCriador
      ? respostas
      : resultadoPublicado
        ? respostas.filter((resposta) => resposta.resposta === "vou")
        : minhaResposta
          ? [minhaResposta]
          : [],
    confirmados: podeVerResumo ? respostas.filter((resposta) => resposta.resposta === "vou").length : null,
    podeVerResponsaveis: podeVerResumo,
  };
}
