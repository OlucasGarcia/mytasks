# MyTasks

Aplicação de gerenciamento de tarefas com frontend React/Vite, API Node.js e Supabase Auth/PostgreSQL.

## Requisitos

- Node.js 22 ou superior

## Executar localmente

1. Configure o projeto Supabase aplicando a migração descrita em [backend/README.md](./backend/README.md). Confira a tabela e as políticas RLS antes de executar a migração.

2. Em um terminal, configure e inicie a API:

   ```sh
   cd backend
   npm install
   Copy-Item .env.example .env
   # Preencha SUPABASE_ANON_KEY no arquivo .env
   node --env-file=.env server.js
   ```

3. Em outro terminal, instale as dependências do frontend e inicie o Vite:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

4. Abra `http://localhost:5173`, crie uma conta e confirme o e-mail antes de entrar.

A configuração padrão do frontend aponta para `http://localhost:8000/api`. O Supabase persiste as contas, sessões e tarefas; `backend/data.json` é somente a origem legada de uma importação opcional, não é armazenamento de produção.

## Verificações

- Backend: `cd backend` e `npm test`
- Frontend: `cd frontend` e `npm run build` / `npm run lint`

Consulte [backend/README.md](./backend/README.md) para configuração de produção, RLS, deployment e importação das tarefas legadas.
