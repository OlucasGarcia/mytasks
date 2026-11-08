# MyTasks

Aplicação de gerenciamento de tarefas com frontend React/Vite e Supabase Auth/Database.

## Requisitos

- Node.js 20 ou superior

## Executar localmente

1. Configure o frontend copiando `frontend/.env.example` para `frontend/.env` e preenchendo `VITE_SUPABASE_ANON_KEY` com a chave pública do projeto.

2. Instale as dependências do frontend e inicie o Vite:
   ```sh
   cd frontend
   npm install
   npm run dev
   ```

3. Abra o endereço exibido pelo Vite e crie uma conta. Se a confirmação de e-mail estiver habilitada, confirme o endereço antes do login.

## Verificações

- Frontend: `cd frontend` e `npm run build` / `npm run lint`