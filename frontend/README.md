# MyTasks Frontend

Frontend React com Vite. Cadastro, login, recuperação de senha e tarefas usam a API HTTP; o frontend nunca recebe credenciais administrativas do Supabase.

Por padrão, a API local é `http://localhost:8000/api`. Copie `.env.example` para `.env` para personalizar `VITE_API_URL` ou `VITE_DATA_SOURCE`. Para produção, configure `VITE_API_URL` no projeto Vercel frontend com a URL HTTP do backend (não a URL do Supabase).

O projeto Vercel frontend deve usar Root Directory `frontend`. `vercel.json` aplica o fallback da SPA para que rotas como `/cadastro`, `/login` e `/auth/callback` sejam servidas pelo aplicativo.

Consulte [backend/README.md](../backend/README.md) para banco, RLS, variáveis e migração segura dos dados legados.
