# MyTasks API

API HTTP do MyTasks, implementada com Node.js sem dependências externas. Os dados ficam em `backend/data.json` (ou no caminho definido por `DATA_FILE`); esse arquivo é criado automaticamente e não deve ser enviado ao repositório.

## Requisitos

- Node.js 20 ou superior

## Executar

No diretório `backend`:

```sh
npm start
```

O servidor fica disponível em `http://localhost:8000`. Para desenvolvimento com reinicialização automática, use `npm run dev`. Para executar os testes, use `npm test`.

O frontend usa `VITE_API_URL=http://localhost:8000/api`. Configure `CORS_ORIGIN` como uma lista de origens separadas por vírgula caso o frontend esteja em outro endereço.

## Implantação na Vercel

Com o Root Directory definido como `backend`, a função `api/[...path].js` encaminha as requisições ao mesmo servidor HTTP usado localmente. A Vercel reconhece a função pela pasta `api`; não é necessário um `vercel.json` para esse roteamento.

Configure `CORS_ORIGIN` nas variáveis de ambiente da Vercel com a origem exata do frontend publicado. É possível informar várias origens separadas por vírgula. As origens locais `http://localhost:5173` e `http://127.0.0.1:5173` permanecem permitidas; origens não listadas são rejeitadas. O backend não define um domínio de frontend por padrão.

**Limitação de produção:** o armazenamento em `data.json` não é persistente nem gravável de forma confiável em funções serverless. O endpoint de health pode responder, mas cadastro, autenticação e tarefas não devem ser considerados prontos para produção até que o backend use armazenamento persistente compartilhado. O frontend da branch de migração Supabase acessa Supabase diretamente, mas o repositório não contém migração de esquema nem políticas RLS; isso não substitui uma migração validada deste backend.

## Endpoints

- `GET /api/health`
- `POST /api/auth/register` — recebe `{ "name", "email", "password" }`
- `POST /api/auth/login` — recebe `{ "email", "password" }`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

As rotas autenticadas recebem `Authorization: Bearer <token>`. Cada usuário só pode listar e alterar as próprias tarefas. Erros retornam JSON no formato `{ "error": { "message": "..." } }`.
