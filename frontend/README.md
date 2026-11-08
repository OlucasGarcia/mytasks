# MyTasks Frontend

# MyTasks Frontend

Frontend React com Vite e Supabase Auth/Database.

## Configuração

Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_ANON_KEY` com a chave pública (publishable/anon) do projeto Supabase. Não use uma chave `service_role` no frontend.

```sh
npm install
npm run dev
```

O cliente Supabase utiliza sessão persistente, renovação automática e detecção de sessão a partir da URL. A API Node antiga não é usada pelo frontend.

## Verificações

```sh
npm run lint
npm run build
```
