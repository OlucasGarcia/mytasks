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
