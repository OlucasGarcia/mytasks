import { createClient } from '@supabase/supabase-js'
import { createServer as createHttpServer } from 'node:http'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const MAX_BODY_BYTES = 1024 * 1024
const TASK_STATUSES = new Set(['pending', 'in_progress', 'completed'])
const TASK_PRIORITIES = new Set(['low', 'medium', 'high'])
const LOCAL_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

class HttpError extends Error {
    constructor(status, message) {
        super(message)
        this.status = status
    }
}

function getAllowedOrigins() {
    const configuredOrigins = process.env.CORS_ORIGIN || ''
    const origins = configuredOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)

    if (origins.includes('*')) {
        throw new HttpError(503, 'CORS_ORIGIN não pode conter wildcard.')
    }

    for (const origin of origins) {
        let parsed
        try {
            parsed = new URL(origin)
        } catch {
            throw new HttpError(503, 'CORS_ORIGIN contém uma origem inválida.')
        }

        if (
            parsed.origin !== origin ||
            (parsed.protocol !== 'https:' && !LOCAL_ORIGINS.includes(origin))
        ) {
            throw new HttpError(503, 'CORS_ORIGIN deve conter origens HTTPS válidas.')
        }
    }

    return [...new Set([...LOCAL_ORIGINS, ...origins])]
}

function getFrontendUrl() {
    const configuredUrl = process.env.FRONTEND_URL

    if (!configuredUrl && process.env.NODE_ENV === 'production') {
        throw new HttpError(503, 'A origem do frontend não está configurada.')
    }

    const frontendUrl = configuredUrl || LOCAL_ORIGINS[0]
    let parsed

    try {
        parsed = new URL(frontendUrl)
    } catch {
        throw new HttpError(503, 'A origem do frontend não está configurada corretamente.')
    }

    if (
        parsed.origin !== frontendUrl.replace(/\/$/, '') ||
        (parsed.protocol !== 'https:' && !LOCAL_ORIGINS.includes(parsed.origin))
    ) {
        throw new HttpError(503, 'A origem do frontend não está configurada corretamente.')
    }

    if (!getAllowedOrigins().includes(parsed.origin)) {
        throw new HttpError(503, 'FRONTEND_URL precisa estar incluída em CORS_ORIGIN.')
    }

    return parsed.origin
}

function getSupabaseConfig() {
    const url = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY

    if (!url || !anonKey) {
        throw new HttpError(503, 'A conexão com o serviço de dados não está configurada.')
    }

    let parsedUrl

    try {
        parsedUrl = new URL(url)
    } catch {
        throw new HttpError(503, 'A URL do serviço de dados não está configurada corretamente.')
    }

    if (
        (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') ||
        parsedUrl.username ||
        parsedUrl.password ||
        parsedUrl.pathname !== '/' ||
        parsedUrl.search ||
        parsedUrl.hash
    ) {
        throw new HttpError(503, 'A URL do serviço de dados não está configurada corretamente.')
    }

    return { url: parsedUrl.origin, anonKey }
}

function sendJson(response, status, value, origin) {
    const body = JSON.stringify(value)
    response.writeHead(status, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Cache-Control': 'no-store',
        'Content-Length': Buffer.byteLength(body),
        'Content-Type': 'application/json; charset=utf-8',
        'Vary': 'Origin',
        'X-Content-Type-Options': 'nosniff',
    })
    response.end(body)
}

function sendNoContent(response, origin) {
    response.writeHead(204, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'no-store',
        'Vary': 'Origin',
    })
    response.end()
}

async function readJsonBody(request) {
    if (request.body !== undefined && request.body !== null) {
        if (typeof request.body === 'string' || Buffer.isBuffer(request.body)) {
            try {
                return parseJsonBody(request.body.toString())
            } catch (error) {
                throw new HttpError(400, error.message)
            }
        }

        if (
            typeof request.body !== 'object' ||
            Array.isArray(request.body) ||
            Buffer.isBuffer(request.body)
        ) {
            throw new HttpError(400, 'O corpo JSON precisa ser um objeto.')
        }

        return request.body
    }

    const chunks = []
    let size = 0

    for await (const chunk of request) {
        size += chunk.length

        if (size > MAX_BODY_BYTES) {
            throw new HttpError(413, 'O corpo da requisição excede o limite permitido.')
        }

        chunks.push(chunk)
    }

    if (size === 0) {
        return {}
    }

    if (!request.headers['content-type']?.includes('application/json')) {
        throw new HttpError(415, 'Envie o corpo da requisição como JSON.')
    }

    try {
        return parseJsonBody(Buffer.concat(chunks).toString('utf8'))
    } catch (error) {
        throw new HttpError(400, error.message)
    }
}

function parseJsonBody(value) {
    try {
        const parsed = JSON.parse(value)

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('O corpo JSON precisa ser um objeto.')
        }

        return parsed
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('O corpo da requisição contém JSON inválido.')
        }

        throw error
    }
}

function validateTask(input, existing = {}) {
    const task = { ...existing }

    if ('title' in input || !existing.id) {
        if (typeof input.title !== 'string' || !input.title.trim()) {
            throw new HttpError(400, 'O título da tarefa é obrigatório.')
        }

        if (input.title.trim().length > 100) {
            throw new HttpError(400, 'O título pode ter no máximo 100 caracteres.')
        }

        task.title = input.title.trim()
    }

    for (const [field, maxLength] of [['description', 2000], ['category', 60]]) {
        if (field in input || !existing.id) {
            const value = input[field] ?? ''

            if (typeof value !== 'string' || value.length > maxLength) {
                throw new HttpError(400, `O campo ${field} deve ser um texto de até ${maxLength} caracteres.`)
            }

            task[field] = value.trim()
        }
    }

    if ('priority' in input || !existing.id) {
        const priority = input.priority ?? 'medium'

        if (!TASK_PRIORITIES.has(priority)) {
            throw new HttpError(400, 'A prioridade informada é inválida.')
        }

        task.priority = priority
    }

    if ('status' in input || !existing.id) {
        const status = input.status ?? 'pending'

        if (!TASK_STATUSES.has(status)) {
            throw new HttpError(400, 'O status informado é inválido.')
        }

        task.status = status
    }

    if ('date' in input || !existing.id) {
        const date = input.date ?? ''
        const parsedDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
            ? new Date(`${date}T00:00:00.000Z`)
            : null

        if (
            typeof date !== 'string' ||
            (date && (!parsedDate || Number.isNaN(parsedDate.getTime()) ||
                parsedDate.toISOString().slice(0, 10) !== date))
        ) {
            throw new HttpError(400, 'A data deve estar no formato AAAA-MM-DD.')
        }

        task.date = date
    }

    if ('time' in input || !existing.id) {
        const time = input.time ?? ''

        if (typeof time !== 'string' || (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
            throw new HttpError(400, 'O horário deve estar no formato HH:MM.')
        }

        task.time = time
    }

    return task
}

function validateCredentials(input, isRegistration) {
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    const password = typeof input.password === 'string' ? input.password : ''

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        throw new HttpError(400, 'Digite um e-mail válido.')
    }

    if (password.length < 8 || password.length > 128) {
        throw new HttpError(400, 'A senha deve ter entre 8 e 128 caracteres.')
    }

    if (!isRegistration) {
        return { email, password }
    }

    const name = typeof input.name === 'string' ? input.name.trim() : ''

    if (name.length < 3 || name.length > 100) {
        throw new HttpError(400, 'O nome deve ter entre 3 e 100 caracteres.')
    }

    return { email, name, password }
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: user.email || '',
    }
}

function sessionResponse(session, user) {
    return {
        token: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at || Math.floor(Date.now() / 1000) + session.expires_in,
        user: publicUser(user),
    }
}

function mapTask(row) {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description ?? '',
        category: row.category ?? '',
        priority: row.priority,
        status: row.status,
        date: row.date ?? '',
        time: row.time?.slice(0, 5) ?? '',
        completedAt: row.completed_at ?? null,
        createdAt: row.created_at ?? null,
        updatedAt: row.updated_at ?? null,
    }
}

function databaseTask(task) {
    return {
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        date: task.date || null,
        time: task.time || null,
    }
}

export function createServer({
    clientFactory = createClient,
    fetchImpl = globalThis.fetch,
} = {}) {
    function createSupabaseClient(accessToken) {
        const { url, anonKey } = getSupabaseConfig()

        return clientFactory(url, anonKey, {
            auth: {
                autoRefreshToken: false,
                detectSessionInUrl: false,
                persistSession: false,
            },
            ...(accessToken
                ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
                : {}),
        })
    }

    async function requireUser(request) {
        const authorization = request.headers.authorization || ''
        const token = authorization.startsWith('Bearer ')
            ? authorization.slice('Bearer '.length)
            : ''

        if (!token) {
            throw new HttpError(401, 'Faça login para continuar.')
        }

        const client = createSupabaseClient(token)
        const { data, error } = await client.auth.getUser(token)

        if (error || !data.user) {
            throw new HttpError(401, 'Sua sessão expirou. Entre novamente.')
        }

        return { client, token, user: data.user }
    }

    async function handle(request, response) {
        let origin = LOCAL_ORIGINS[0]

        try {
            const allowedOrigins = getAllowedOrigins()
            const requestOrigin = request.headers.origin
            origin = allowedOrigins.includes(requestOrigin)
                ? requestOrigin
                : allowedOrigins[0]

            if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
                sendJson(response, 403, { error: { message: 'Origem não permitida.' } }, origin)
                return
            }

            if (request.method === 'OPTIONS') {
                response.writeHead(204, {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Credentials': 'true',
                    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Vary': 'Origin',
                })
                response.end()
                return
            }

            const url = new URL(request.url, 'http://localhost')
            const path = url.pathname.replace(/\/+$/, '') || '/'
            const method = request.method

            if (method === 'GET' && path === '/api/health') {
                sendJson(response, 200, { status: 'ok' }, origin)
                return
            }

            if (method === 'GET' && path === '/api/health/ready') {
                const { data, error } = await createSupabaseClient().from('tasks').select('id').limit(1)

                if (error || !Array.isArray(data)) {
                    throw new HttpError(503, 'O banco de dados não está pronto.')
                }

                sendJson(response, 200, { status: 'ok' }, origin)
                return
            }

            if (method === 'POST' && path === '/api/auth/register') {
                const credentials = validateCredentials(await readJsonBody(request), true)
                const client = createSupabaseClient()
                const emailRedirectTo = new URL('/auth/callback', getFrontendUrl()).toString()
                const { data, error } = await client.auth.signUp({
                    email: credentials.email,
                    password: credentials.password,
                    options: {
                        data: { full_name: credentials.name },
                        emailRedirectTo,
                    },
                })

                if (error) {
                    if (error.status === 429) {
                        throw new HttpError(429, 'Muitas tentativas. Aguarde antes de tentar novamente.')
                    }

                    throw new HttpError(400, 'Não foi possível criar a conta com esses dados.')
                }

                if (!data.user) {
                    throw new HttpError(502, 'O serviço de autenticação não retornou o usuário.')
                }

                if (!data.session) {
                    sendJson(
                        response,
                        202,
                        { needsEmailConfirmation: true, user: publicUser(data.user) },
                        origin
                    )
                    return
                }

                sendJson(response, 201, sessionResponse(data.session, data.user), origin)
                return
            }

            if (method === 'POST' && path === '/api/auth/login') {
                const credentials = validateCredentials(await readJsonBody(request), false)
                const { data, error } = await createSupabaseClient().auth.signInWithPassword(credentials)

                if (error || !data.session || !data.user) {
                    throw new HttpError(401, 'E-mail ou senha incorretos, ou a conta ainda não foi confirmada.')
                }

                sendJson(response, 200, sessionResponse(data.session, data.user), origin)
                return
            }

            if (method === 'POST' && path === '/api/auth/refresh') {
                const { refreshToken } = await readJsonBody(request)

                if (typeof refreshToken !== 'string' || refreshToken.length < 20) {
                    throw new HttpError(401, 'Sua sessão expirou. Entre novamente.')
                }

                const { data, error } = await createSupabaseClient().auth.refreshSession({
                    refresh_token: refreshToken,
                })

                if (error || !data.session || !data.user) {
                    throw new HttpError(401, 'Sua sessão expirou. Entre novamente.')
                }

                sendJson(response, 200, sessionResponse(data.session, data.user), origin)
                return
            }

            if (path === '/api/auth/me' && method === 'GET') {
                const { user } = await requireUser(request)
                sendJson(response, 200, { user: publicUser(user) }, origin)
                return
            }

            if (path === '/api/auth/logout' && method === 'POST') {
                const { token } = await requireUser(request)
                const { url, anonKey } = getSupabaseConfig()
                const logoutResponse = await fetchImpl(`${url}/auth/v1/logout`, {
                    method: 'POST',
                    headers: {
                        apikey: anonKey,
                        Authorization: `Bearer ${token}`,
                    },
                    signal: AbortSignal.timeout(10000),
                })

                if (!logoutResponse.ok) {
                    throw new HttpError(503, 'Não foi possível encerrar a sessão. Tente novamente.')
                }

                sendNoContent(response, origin)
                return
            }

            if (path === '/api/auth/password' && method === 'PUT') {
                const { user } = await requireUser(request)
                const input = await readJsonBody(request)
                const currentPassword = typeof input.currentPassword === 'string'
                    ? input.currentPassword
                    : ''
                const newPassword = typeof input.newPassword === 'string'
                    ? input.newPassword
                    : ''

                if (newPassword.length < 8 || newPassword.length > 128) {
                    throw new HttpError(400, 'A nova senha deve ter entre 8 e 128 caracteres.')
                }

                if (currentPassword === newPassword) {
                    throw new HttpError(400, 'A nova senha deve ser diferente da senha atual.')
                }

                const client = createSupabaseClient()
                const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword,
                })

                if (loginError || !loginData.session) {
                    throw new HttpError(401, 'A senha atual está incorreta.')
                }

                const { error: updateError } = await client.auth.updateUser({
                    password: newPassword,
                })

                if (updateError) {
                    throw new HttpError(400, 'Não foi possível atualizar a senha.')
                }

                sendNoContent(response, origin)
                return
            }

            if (path === '/api/auth/password/reset' && method === 'POST') {
                const input = await readJsonBody(request)
                const email = typeof input.email === 'string'
                    ? input.email.trim().toLowerCase()
                    : ''

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
                    throw new HttpError(400, 'Digite um e-mail válido.')
                }

                const redirectTo = new URL('/auth/recovery', getFrontendUrl()).toString()
                const { error } = await createSupabaseClient().auth.resetPasswordForEmail(
                    email,
                    { redirectTo }
                )

                if (error?.status === 429) {
                    throw new HttpError(429, 'Muitas tentativas. Aguarde antes de tentar novamente.')
                }
                if (error) {
                    throw new HttpError(503, 'Não foi possível enviar o e-mail de recuperação.')
                }

                sendJson(response, 200, { status: 'ok' }, origin)
                return
            }

            if (path === '/api/auth/password/recovery' && method === 'PUT') {
                const { client, token } = await requireUser(request)
                const input = await readJsonBody(request)
                const newPassword = typeof input.newPassword === 'string'
                    ? input.newPassword
                    : ''
                const refreshToken = typeof input.refreshToken === 'string'
                    ? input.refreshToken
                    : ''

                if (newPassword.length < 8 || newPassword.length > 128) {
                    throw new HttpError(400, 'A nova senha deve ter entre 8 e 128 caracteres.')
                }
                if (refreshToken.length < 20) {
                    throw new HttpError(401, 'O link de recuperação expirou. Solicite outro.')
                }

                const { error: sessionError } = await client.auth.setSession({
                    access_token: token,
                    refresh_token: refreshToken,
                })

                if (sessionError) {
                    throw new HttpError(401, 'O link de recuperação expirou. Solicite outro.')
                }

                const { error } = await client.auth.updateUser({ password: newPassword })
                if (error) {
                    throw new HttpError(400, 'Não foi possível atualizar a senha.')
                }

                sendNoContent(response, origin)
                return
            }

            if (path === '/api/tasks' || path.startsWith('/api/tasks/')) {
                const { client, user } = await requireUser(request)

                if (path === '/api/tasks' && method === 'GET') {
                    const { data, error } = await client
                        .from('tasks')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })

                    if (error) throw error

                    sendJson(response, 200, data.map(mapTask), origin)
                    return
                }

                if (path === '/api/tasks' && method === 'POST') {
                    const validatedTask = validateTask(await readJsonBody(request))
                    const { data, error } = await client
                        .from('tasks')
                        .insert({
                            ...databaseTask(validatedTask),
                            user_id: user.id,
                            completed_at: validatedTask.status === 'completed'
                                ? new Date().toISOString()
                                : null,
                        })
                        .select('*')
                        .single()

                    if (error) throw error

                    sendJson(response, 201, mapTask(data), origin)
                    return
                }

                let taskId
                try {
                    taskId = decodeURIComponent(path.slice('/api/tasks/'.length))
                } catch {
                    throw new HttpError(404, 'Tarefa não encontrada.')
                }

                if (!UUID_PATTERN.test(taskId)) {
                    throw new HttpError(404, 'Tarefa não encontrada.')
                }

                if (method === 'PUT') {
                    const { data: currentRow, error: readError } = await client
                        .from('tasks')
                        .select('*')
                        .eq('id', taskId)
                        .eq('user_id', user.id)
                        .maybeSingle()

                    if (readError) throw readError
                    if (!currentRow) throw new HttpError(404, 'Tarefa não encontrada.')

                    const currentTask = mapTask(currentRow)
                    const validatedTask = validateTask(await readJsonBody(request), currentTask)
                    const payload = databaseTask(validatedTask)

                    if ('status' in validatedTask) {
                        payload.completed_at =
                            validatedTask.status === 'completed'
                                ? currentTask.status === 'completed'
                                    ? currentTask.completedAt
                                    : new Date().toISOString()
                                : null
                    }

                    const { data, error } = await client
                        .from('tasks')
                        .update(payload)
                        .eq('id', taskId)
                        .eq('user_id', user.id)
                        .select('*')
                        .maybeSingle()

                    if (error) throw error
                    if (!data) throw new HttpError(404, 'Tarefa não encontrada.')

                    sendJson(response, 200, mapTask(data), origin)
                    return
                }

                if (method === 'DELETE') {
                    const { data, error } = await client
                        .from('tasks')
                        .delete()
                        .eq('id', taskId)
                        .eq('user_id', user.id)
                        .select('id')
                        .maybeSingle()

                    if (error) throw error
                    if (!data) throw new HttpError(404, 'Tarefa não encontrada.')

                    sendNoContent(response, origin)
                    return
                }
            }

            throw new HttpError(404, 'Rota não encontrada.')
        } catch (error) {
            const status = error instanceof HttpError ? error.status : 500

            if (status >= 500 && !(error instanceof HttpError)) {
                console.error('Erro ao processar requisição:', {
                    name: error.name,
                    code: error.code,
                    status: error.status,
                })
            }

            sendJson(
                response,
                status,
                {
                    error: {
                        message: status >= 500
                            ? error instanceof HttpError
                                ? error.message
                                : 'Erro interno do servidor.'
                            : error.message,
                    },
                },
                origin
            )
        }
    }

    return createHttpServer((request, response) => {
        void handle(request, response)
    })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    const server = createServer()
    const port = Number(process.env.PORT || 8000)
    server.listen(port, () => {
        console.log(`MyTasks API disponível em http://localhost:${port}`)
    })
}
