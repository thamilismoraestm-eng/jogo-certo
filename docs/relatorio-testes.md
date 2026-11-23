# Relatório de testes — Jogo Certo

Data desta revisão: 23/11/2026.

## Verificações automatizadas

| Verificação | Resultado | Observação |
|---|---|---|
| `npm test` | Passou | 6 testes Vitest e 24 testes Node.js passaram. Inclui permissões de exclusão, edição e administração de grupos, respostas, visibilidade e validações. |
| `npm run lint` | Passou | ESLint sem erros ou avisos. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passou | Sem erros de TypeScript. |
| `npm run build` | Passou | Build de produção do Next.js concluído. |
| `npm run db:check` | Passou | Neon conectado; tabelas e seis regras de exclusão em cascata confirmadas por consulta somente de leitura. |
| `git diff --check` | Passou | Sem erros de whitespace no diff. |
| `npm audit --offline` | Inconclusivo | O comando offline reportou 0 vulnerabilidades, mas a instalação do Vitest reportou 4 moderadas e a auditoria online não alcançou o registro npm. Nenhuma atualização automática foi feita; verificar novamente quando a rede estiver disponível. |

## Exclusão de grupo

Não foi excluído um grupo real durante esta revisão. A permissão foi coberta por testes unitários, e as relações de cascata foram conferidas no Neon sem alterar dados. Para testar manualmente com segurança, crie dados identificados como demonstração:

1. Na Conta A, crie um grupo, um evento dentro dele, respostas e compromissos de equipamento.
2. Crie também um evento independente e, se desejar, um segundo grupo com dados de demonstração.
3. Na Conta B, confirme que não aparece a opção de excluir o grupo da Conta A. Uma tentativa direta da ação também deve ser recusada.
4. Na Conta A, escolha **Excluir grupo** e confirme a mensagem irreversível.
5. Confira que o grupo, seus integrantes e seus eventos vinculados desapareceram; respostas e equipamentos desses eventos também foram removidos. O evento independente e o segundo grupo devem continuar existindo.

## Testes manuais anteriores

A responsável pelo projeto informou que as Etapas 0 a 5 já foram testadas manualmente. Os resultados detalhados por critério de aceite não estavam registrados no repositório durante esta revisão. A exclusão de grupo ainda precisa do cenário manual descrito acima antes da apresentação.

## Materiais de apresentação

O roteiro de duas contas está no `README.md`. As capturas de tela das telas principais ainda devem ser feitas durante a demonstração, com dados fictícios e sem exibir informações pessoais.
