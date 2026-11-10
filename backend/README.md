# MyTasks API

API Node.js para autenticação e tarefas. Supabase Auth gerencia contas e sessões; PostgreSQL armazena as tarefas com Row Level Security (RLS). `data.json` não é usado pelo servidor e não deve ser implantado.

## Requisitos e execução local

- Node.js 22 ou superior
- Projeto Supabase configurado com a migração deste diretório

No diretório `backend`, copie `.env.example` para `.env`, preencha a chave pública `SUPABASE_ANON_KEY` do projeto e inicie:

```sh
npm install
node --env-file=.env server.js
```

O servidor fica disponível em `http://localhost:8000`. Para desenvolvimento, use `node --env-file=.env --watch server.js`. Os testes são executados com `npm test` e usam um cliente Supabase falso, sem dados reais nem conexão ao projeto.

## Migração do banco

Antes de aplicar `supabase/migrations/20261109230000_tasks.sql`, confira no painel Supabase se `public.tasks` já existe e revise suas colunas, grants e políticas RLS. A migração **aborta sem alterar dados** caso a tabela já exista; adapte-a após a inspeção, em vez de criar uma tabela duplicada ou substituir políticas desconhecidas. A tabela nova usa RLS, permite acesso apenas à própria conta autenticada e não concede políticas a `anon`.

Ative confirmação por e-mail no Supabase Auth. Configure o Site URL e permita os redirecionamentos exatos `/auth/callback` e `/auth/recovery` no domínio do frontend. Para uso público, configure SMTP transacional próprio no Supabase; o provedor padrão tem limites de envio.

### Preservar tarefas de `data.json`

As senhas, hashes e sessões antigas **não** são importados. Cada pessoa precisa se cadastrar e confirmar o mesmo e-mail da conta legada antes de importar tarefas. Faça e mantenha um backup protegido do `data.json`.

`npm run import:legacy -- --dry-run` valida somente o arquivo local e mostra contagens. Para importar, defina `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente local seguro, depois execute `npm run import:legacy`. O script associa tarefas apenas a usuários Supabase confirmados com o mesmo e-mail, não imprime dados pessoais, não transfere hashes de senha ou sessões legadas e não sobrescreve IDs que já existam. A chave administrativa é necessária apenas para essa importação única: não a configure no frontend nem como variável de runtime da API. Se o importador parar por conflito/erro, corrija a causa e reexecute; IDs existentes são tratados sem duplicação.

## Variáveis de ambiente

| Variável | Onde configurar | Uso |
|---|---|---|
| `SUPABASE_URL` | Backend | URL pública do projeto Supabase |
| `SUPABASE_ANON_KEY` | Backend | Chave pública do projeto; não usar `service_role` |
| `CORS_ORIGIN` | Backend | Origens exatas separadas por vírgula; wildcard é rejeitado |
| `FRONTEND_URL` | Backend | Origem canônica para links de confirmação/recuperação; também precisa estar em `CORS_ORIGIN` |
| `VITE_API_URL` | Frontend | URL HTTP da API, por exemplo `https://mytasks-backend.vercel.app/api`; não é URL do Supabase |

`SUPABASE_SERVICE_ROLE_KEY` é usada somente pelo importador local, nunca pela API serverless ou pelo frontend. Não armazene credenciais em Git ou `.env.example`.

## Vercel

Mantenha o Root Directory do projeto de backend como `backend`. A função `api/[...path].js` encaminha todas as rotas ao mesmo servidor. Não é necessário `vercel.json` no backend. Configure as variáveis de runtime acima no projeto Vercel e faça redeploy após aplicar a migração do banco. `GET /api/health` é liveness; `GET /api/health/ready` verifica acesso à tabela e à configuração do banco.

## Endpoints

- `GET /api/health` e `GET /api/health/ready`
- `POST /api/auth/register` — cadastro; retorna HTTP 202 quando falta confirmar o e-mail
- `POST /api/auth/login`
- `POST /api/auth/refresh` — rotaciona access/refresh tokens
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `PUT /api/auth/password` — exige a senha atual
- `POST /api/auth/password/reset` e `PUT /api/auth/password/recovery`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

Rotas autenticadas recebem `Authorization: Bearer <access-token>`. O isolamento é aplicado pela API e pelas políticas RLS; erros são JSON no formato `{ "error": { "message": "..." } }`.
