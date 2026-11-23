# Registro de uso de IA

## Ferramenta

- **Codex:** apoio à implementação e revisão das etapas do Jogo Certo.

## Decisões registradas nesta etapa

- A exclusão de grupo é permitida apenas quando a pessoa autenticada é o criador e sua associação ainda tem papel de administrador.
- Uma única instrução `DELETE` na tabela `grupo` usa as cascatas das chaves estrangeiras para remover integrantes, eventos vinculados, presenças e equipamentos de forma atômica.
- Eventos independentes não são apagados, pois não possuem `grupo_id`.
- A interface informa o efeito irreversível antes de confirmar.
- Não foi necessária uma nova migração.
- A revisão do código encontrou edição de grupo e promoção de integrantes ainda ausentes, embora previstas em RF03/RF05; ambas foram adicionadas com autorização de administrador validada no servidor.

## Pedido principal

Revisar o Jogo Certo, implementar a exclusão segura de grupos, testar permissões e atualizar a documentação para a apresentação acadêmica.
