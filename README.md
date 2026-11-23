# Jogo Certo

O Jogo Certo é um protótipo web para organizar grupos, treinos e partidas esportivas. Cada pessoa pode criar eventos independentes ou em grupos, compartilhar convites, confirmar presença e combinar equipamentos.

## Funcionalidades

- Cadastro, login e logout com e-mail e senha.
- Painel protegido com grupos e eventos da pessoa.
- Criação de grupos e entrada por código de convite.
- Edição do grupo e promoção de integrantes por administradores.
- Página de grupo com integrantes e eventos vinculados.
- Exclusão de grupo somente pelo criador que ainda é administrador. A operação é irreversível: apaga os integrantes e eventos do grupo e, em cascata, suas presenças e equipamentos. Eventos independentes e outros grupos ficam preservados.
- Criação, edição e compartilhamento de eventos independentes e de grupo.
- Respostas “Vou” e “Não vou”, com alteração até o início do evento.
- Cadastro de equipamentos necessários e registro do que cada participante levará.
- Publicação das informações de organização, aviso de mínimo de participantes e cancelamento pelo criador.
- Regras de acesso e visibilidade aplicadas no servidor.

## Tecnologias

- Next.js com App Router e TypeScript.
- Tailwind CSS.
- PostgreSQL hospedado no Neon.
- Drizzle ORM e Drizzle Kit para schema e migrações.
- Better Auth para autenticação.
- Zod para validação.
- Vitest e testes do Node.js para regras e validações.

## Estrutura do projeto

```text
src/app/              Páginas, layouts e formulários do Next.js
src/app/api/auth/     Rotas do Better Auth
src/components/       Componentes compartilhados
src/lib/              Autenticação, banco, schemas, validações e regras
drizzle/              Migrações e snapshots versionados
tests/                Testes automatizados
scripts/              Verificações auxiliares do Neon
spec.md               Requisitos e regras do protótipo
AGENTS.md             Regras de desenvolvimento
```

## Requisitos para desenvolvimento

- Node.js 22 ou versão compatível com Next.js 16.
- npm.
- Um banco PostgreSQL no Neon.

## Instalação e configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local`.

3. No `.env.local`, substitua os valores fictícios pelas variáveis do seu ambiente. Configure `DATABASE_URL` com a conexão pooled do Neon para a aplicação, `DATABASE_URL_UNPOOLED` com a conexão direta para migrações, `BETTER_AUTH_SECRET` com uma chave aleatória e `BETTER_AUTH_URL` com o endereço local ou publicado.

4. Mantenha `.env.local` fora do Git. Nunca coloque credenciais em código, documentação ou capturas de tela.

## Executar localmente

```bash
npm run dev
```

Abra <http://localhost:3000>.

## Testes e verificações

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

O comando `npm test` executa os testes Vitest e a suíte existente do Node.js.

## Banco de dados e migrações

O schema Drizzle fica em `src/lib/` e é agregado por `src/lib/schema.ts`. As migrações SQL ficam em `drizzle/`.

```bash
npm run db:check
npm run db:generate
npm run db:migrate
```

`db:check` confirma a conexão e as tabelas esperadas. `db:generate` cria uma migração local a partir do schema. Revise o SQL gerado antes de executar `db:migrate`; este último usa `DATABASE_URL_UNPOOLED` e altera o schema do banco.

### Exclusão e integridade dos dados

Ao excluir um grupo, o banco usa chaves estrangeiras com `ON DELETE CASCADE`: apaga as associações de integrantes e os eventos ligados ao grupo. A exclusão dos eventos remove em cascata as presenças, equipamentos necessários e equipamentos levados. A ação é feita por um único `DELETE` no grupo, que o PostgreSQL executa atomicamente junto com as cascatas. Eventos independentes têm `grupo_id` nulo, portanto não são apagados.

## Acesso e visibilidade

- Eventos de grupo podem ser vistos pelo criador e por integrantes atuais do grupo.
- Eventos independentes podem ser abertos por qualquer pessoa autenticada com acesso ao link ou código.
- Antes da publicação, participantes comuns veem apenas a própria resposta e seus equipamentos; o criador vê todas as respostas e compromissos.
- Depois da publicação, participantes veem o total de confirmações “Vou”, os nomes de quem confirmou e os responsáveis pelos equipamentos. Respostas “Não vou” de outras pessoas continuam privadas.
- Apenas o criador pode editar, publicar ou cancelar o próprio evento. Respostas e compromissos são bloqueados depois do início ou cancelamento.
- Apenas o criador do grupo, que ainda tenha papel de administrador, pode excluir o grupo.

## Implantação e apresentação

O projeto está preparado para publicação na Vercel. Configure as variáveis de ambiente no painel da Vercel e use um banco/branch Neon apropriado para produção. A URL pública deve ser conferida no painel do projeto antes de ser adicionada a este documento.

Para demonstrar com duas contas, crie um grupo e evento com a primeira conta, adicione a segunda pelo convite, confirme presenças e equipamentos com ambas, publique o resultado e confira a visibilidade. Por fim, teste que a segunda conta não consegue excluir o grupo e que a primeira consegue após confirmar a operação irreversível.

## Limitações do protótipo

Não há chat, notificações, recuperação de senha, verificação de e-mail, login social, lista de espera, treinos recorrentes, uploads ou aplicativo nativo. Consulte `spec.md` para as regras detalhadas e os critérios de aceite.
