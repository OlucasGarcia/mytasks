# MyTasks

Aplicação de gerenciamento de tarefas com frontend React/Vite e API Node.js.

## Requisitos

- Node.js 20 ou superior

## Executar localmente

1. Em um terminal, inicie a API:

   ```sh
   cd backend
   npm start
   ```

2. Em outro terminal, instale as dependências do frontend e inicie o Vite:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

3. Abra o endereço exibido pelo Vite (por padrão `http://localhost:5173`), crie uma conta e comece a usar o app.

A configuração padrão do frontend aponta para `http://localhost:8000/api`. Os dados e as contas são persistidos em `backend/data.json`, que é ignorado pelo Git.

## Verificações

- Backend: `cd backend` e `npm test`
- Frontend: `cd frontend` e `npm run build` / `npm run lint`

Consulte [backend/README.md](./backend/README.md) para detalhes da API e configurações de execução.