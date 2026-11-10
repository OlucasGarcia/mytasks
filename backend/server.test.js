import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { afterEach, beforeEach, test } from 'node:test'
import vercelHandler from './api/[...path].js'
import { createServer } from './server.js'

const originalEnvironment = {}
let server
let fakeSupabase
let baseUrl

function createFakeSupabase({ requireEmailConfirmation = false } = {}) {
    const users = []
    const accessTokens = new Map()
    const refreshTokens = new Map()
    const tasks = []

    function createSession(user) {
        const session = {
            access_token: `access-${crypto.randomUUID()}`,
            refresh_token: `refresh-${crypto.randomUUID()}`,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            expires_in: 3600,
        }
        accessTokens.set(session.access_token, user.id)
        refreshTokens.set(session.refresh_token, user.id)
        return session
    }

    class FakeQuery {
        constructor(token) {
            this.token = token
            this.action = 'select'
            this.values = null
            this.filters = []
            this.shouldReturnSingle = false
        }

        select() {
            return this
        }

        eq(field, value) {
            this.filters.push([field, value])
            return this
        }

        order() {
            return this
        }

        limit() {
            return this
        }

        insert(values) {
            this.action = 'insert'
            this.values = values
            return this
        }

        update(values) {
            this.action = 'update'
            this.values = values
            return this
        }

        delete() {
            this.action = 'delete'
            return this
        }

        single() {
            this.shouldReturnSingle = true
            return this.run()
        }

        maybeSingle() {
            this.shouldReturnSingle = true
            return this.run()
        }

        then(resolve, reject) {
            return this.run().then(resolve, reject)
        }

        async run() {
            const userId = accessTokens.get(this.token)

            if (this.action === 'insert') {
                if (!userId || this.values.user_id !== userId) {
                    return { data: null, error: { message: 'row-level security violation' } }
                }

                const now = new Date().toISOString()
                const row = {
                    id: crypto.randomUUID(),
                    created_at: now,
                    updated_at: now,
                    ...this.values,
                }
                tasks.push(row)
                return { data: this.shouldReturnSingle ? row : [row], error: null }
            }

            const matchingTasks = tasks.filter((task) =>
                task.user_id === userId &&
                this.filters.every(([field, value]) => task[field] === value)
            )

            if (this.action === 'update') {
                const row = matchingTasks[0]
                if (row) Object.assign(row, this.values, { updated_at: new Date().toISOString() })
                return { data: this.shouldReturnSingle ? row ?? null : row ? [row] : [], error: null }
            }

            if (this.action === 'delete') {
                const row = matchingTasks[0]
                if (row) tasks.splice(tasks.indexOf(row), 1)
                return { data: this.shouldReturnSingle ? row ?? null : row ? [row] : [], error: null }
            }

            return {
                data: this.shouldReturnSingle ? matchingTasks[0] ?? null : matchingTasks,
                error: null,
            }
        }
    }

    function clientFactory(_url, _key, options = {}) {
        const token = options.global?.headers?.Authorization?.replace(/^Bearer /, '') || ''
        let currentUserId = null

        return {
            auth: {
                async signUp({ email, password, options: signUpOptions }) {
                    if (users.some((user) => user.email === email)) {
                        return { data: { user: null, session: null }, error: { status: 400 } }
                    }

                    const user = {
                        id: crypto.randomUUID(),
                        email,
                        password,
                        email_confirmed_at: requireEmailConfirmation ? null : new Date().toISOString(),
                        user_metadata: signUpOptions.data,
                    }
                    users.push(user)

                    return {
                        data: {
                            user,
                            session: requireEmailConfirmation ? null : createSession(user),
                        },
                        error: null,
                    }
                },

                async signInWithPassword({ email, password }) {
                    const user = users.find((item) =>
                        item.email === email &&
                        item.password === password &&
                        (!requireEmailConfirmation || item.email_confirmed_at)
                    )

                    if (!user) {
                        return { data: { user: null, session: null }, error: { status: 400 } }
                    }

                    currentUserId = user.id
                    const session = createSession(user)
                    return { data: { user, session }, error: null }
                },

                async getUser(accessToken) {
                    const userId = accessTokens.get(accessToken || token)
                    const user = users.find((item) => item.id === userId)
                    return user
                        ? { data: { user }, error: null }
                        : { data: { user: null }, error: { status: 401 } }
                },

                async refreshSession({ refresh_token: refreshToken }) {
                    const userId = refreshTokens.get(refreshToken)
                    const user = users.find((item) => item.id === userId)

                    if (!user) {
                        return { data: { user: null, session: null }, error: { status: 401 } }
                    }

                    refreshTokens.delete(refreshToken)
                    const session = createSession(user)
                    return { data: { user, session }, error: null }
                },

                async updateUser({ password }) {
                    const user = users.find((item) => item.id === currentUserId)
                    if (!user) return { data: { user: null }, error: { status: 401 } }
                    user.password = password
                    return { data: { user }, error: null }
                },

                async resetPasswordForEmail() {
                    return { data: {}, error: null }
                },

                async setSession({ access_token: accessToken, refresh_token: refreshToken }) {
                    const userId = accessTokens.get(accessToken)
                    if (!userId || refreshTokens.get(refreshToken) !== userId) {
                        return { data: { session: null }, error: { status: 401 } }
                    }

                    currentUserId = userId
                    const user = users.find((item) => item.id === userId)
                    return { data: { session: createSession(user) }, error: null }
                },
            },

            from() {
                return new FakeQuery(token)
            },
        }
    }

    return {
        clientFactory,
        logout: async (_url, options) => {
            const token = options.headers.Authorization.replace(/^Bearer /, '')
            const userId = accessTokens.get(token)
            if (!userId) return new Response(null, { status: 401 })
            for (const [refreshToken, refreshUserId] of refreshTokens) {
                if (refreshUserId === userId) refreshTokens.delete(refreshToken)
            }
            return new Response(null, { status: 204 })
        },
    }
}

async function request(path, { token, ...options } = {}) {
    const headers = { ...options.headers }

    if (options.body && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json'
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        body: options.body && typeof options.body === 'object'
            ? JSON.stringify(options.body)
            : options.body,
    })
    const body = response.status === 204 ? null : await response.json()

    return { response, body }
}

async function register(email = 'ana@example.test') {
    return request('/api/auth/register', {
        method: 'POST',
        body: { name: 'Ana Silva', email, password: 'senha-segura-123' },
    })
}

beforeEach(async () => {
    for (const key of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'FRONTEND_URL', 'CORS_ORIGIN', 'NODE_ENV']) {
        originalEnvironment[key] = process.env[key]
    }
    process.env.SUPABASE_URL = 'https://supabase.example.test'
    process.env.SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.FRONTEND_URL = 'http://localhost:5173'
    process.env.CORS_ORIGIN = ''
    delete process.env.NODE_ENV

    fakeSupabase = createFakeSupabase()
    server = createServer({
        clientFactory: fakeSupabase.clientFactory,
        fetchImpl: fakeSupabase.logout,
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterEach(async () => {
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    })

    for (const [key, value] of Object.entries(originalEnvironment)) {
        if (value === undefined) {
            delete process.env[key]
        } else {
            process.env[key] = value
        }
    }
})

test('registra, autentica, consulta o perfil e encerra a sessão', async () => {
    const registration = await register()
    assert.equal(registration.response.status, 201)
    assert.equal(registration.body.user.email, 'ana@example.test')
    assert.ok(registration.body.token)
    assert.ok(registration.body.refreshToken)

    const profile = await request('/api/auth/me', { token: registration.body.token })
    assert.equal(profile.response.status, 200)
    assert.equal(profile.body.user.name, 'Ana Silva')

    const login = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'ana@example.test', password: 'senha-segura-123' },
    })
    assert.equal(login.response.status, 200)
    assert.ok(login.body.token)

    const logout = await request('/api/auth/logout', {
        method: 'POST',
        token: registration.body.token,
    })
    assert.equal(logout.response.status, 204)

    const activeAccessToken = await request('/api/auth/me', { token: registration.body.token })
    assert.equal(activeAccessToken.response.status, 200)

    const revokedRefreshToken = await request('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: registration.body.refreshToken },
    })
    assert.equal(revokedRefreshToken.response.status, 401)
})

test('rejeita credenciais inválidas e exige confirmação de e-mail quando habilitada', async () => {
    const invalidLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'unknown@example.test', password: 'senha-segura-123' },
    })
    assert.equal(invalidLogin.response.status, 401)

    const confirmationServer = createServer({
        clientFactory: createFakeSupabase({ requireEmailConfirmation: true }).clientFactory,
    })
    await new Promise((resolve) => confirmationServer.listen(0, '127.0.0.1', resolve))
    const confirmationUrl = `http://127.0.0.1:${confirmationServer.address().port}`

    try {
        const response = await fetch(`${confirmationUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Bia Silva',
                email: 'bia@example.test',
                password: 'senha-segura-123',
            }),
        })
        assert.equal(response.status, 202)
        assert.equal((await response.json()).needsEmailConfirmation, true)
    } finally {
        await new Promise((resolve, reject) => {
            confirmationServer.close((error) => error ? reject(error) : resolve())
        })
    }
})

test('renova tokens expirados usando refresh token rotativo', async () => {
    const registration = await register()
    const refreshed = await request('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: registration.body.refreshToken },
    })

    assert.equal(refreshed.response.status, 200)
    assert.notEqual(refreshed.body.token, registration.body.token)
    assert.notEqual(refreshed.body.refreshToken, registration.body.refreshToken)

    const staleRefreshToken = await request('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: registration.body.refreshToken },
    })
    assert.equal(staleRefreshToken.response.status, 401)

    const profile = await request('/api/auth/me', { token: refreshed.body.token })
    assert.equal(profile.response.status, 200)
})

test('altera senha após reautenticar e oferece recuperação por e-mail', async () => {
    const registration = await register()
    const rejectedChange = await request('/api/auth/password', {
        method: 'PUT',
        token: registration.body.token,
        body: { currentPassword: 'senha-incorreta', newPassword: 'nova-senha-123' },
    })
    assert.equal(rejectedChange.response.status, 401)

    const changed = await request('/api/auth/password', {
        method: 'PUT',
        token: registration.body.token,
        body: { currentPassword: 'senha-segura-123', newPassword: 'nova-senha-123' },
    })
    assert.equal(changed.response.status, 204)

    const oldPasswordLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'ana@example.test', password: 'senha-segura-123' },
    })
    assert.equal(oldPasswordLogin.response.status, 401)

    const resetRequest = await request('/api/auth/password/reset', {
        method: 'POST',
        body: { email: 'ana@example.test' },
    })
    assert.equal(resetRequest.response.status, 200)

    const completedRecovery = await request('/api/auth/password/recovery', {
        method: 'PUT',
        token: registration.body.token,
        body: {
            newPassword: 'senha-recuperada-123',
            refreshToken: registration.body.refreshToken,
        },
    })
    assert.equal(completedRecovery.response.status, 204)
})

test('cria, lista, atualiza e exclui tarefas sem permitir acesso entre usuários', async () => {
    const firstRegistration = await register()
    const secondRegistration = await register('bia@example.test')
    const token = firstRegistration.body.token

    const unauthorized = await request('/api/tasks')
    assert.equal(unauthorized.response.status, 401)

    const created = await request('/api/tasks', {
        method: 'POST',
        token,
        body: {
            title: 'Revisar estoque',
            description: '',
            category: 'Loja',
            priority: 'high',
            status: 'pending',
            date: '2026-10-26',
            time: '09:30',
        },
    })
    assert.equal(created.response.status, 201)
    assert.equal(created.body.title, 'Revisar estoque')

    const secondUserTasks = await request('/api/tasks', {
        token: secondRegistration.body.token,
    })
    assert.deepEqual(secondUserTasks.body, [])

    const update = await request(`/api/tasks/${created.body.id}`, {
        method: 'PUT',
        token,
        body: { status: 'completed' },
    })
    assert.equal(update.response.status, 200)
    assert.equal(update.body.status, 'completed')
    assert.ok(update.body.completedAt)

    const crossUserUpdate = await request(`/api/tasks/${created.body.id}`, {
        method: 'PUT',
        token: secondRegistration.body.token,
        body: { title: 'Não autorizado' },
    })
    assert.equal(crossUserUpdate.response.status, 404)

    const list = await request('/api/tasks', { token })
    assert.equal(list.body.length, 1)

    const deleted = await request(`/api/tasks/${created.body.id}`, {
        method: 'DELETE',
        token,
    })
    assert.equal(deleted.response.status, 204)
})

test('valida campos das tarefas e JSON inválido', async () => {
    const registration = await register()
    const invalidPriority = await request('/api/tasks', {
        method: 'POST',
        token: registration.body.token,
        body: { title: 'Tarefa', priority: 'urgent' },
    })
    assert.equal(invalidPriority.response.status, 400)

    const invalidDate = await request('/api/tasks', {
        method: 'POST',
        token: registration.body.token,
        body: { title: 'Tarefa', date: '2026-02-31' },
    })
    assert.equal(invalidDate.response.status, 400)

    const invalidJson = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
    })
    assert.equal(invalidJson.status, 400)
    assert.ok((await invalidJson.json()).error.message)
})

test('restringe CORS e mantém as origens locais', async () => {
    process.env.CORS_ORIGIN = 'https://frontend.example.test'

    const configuredOrigin = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: 'https://frontend.example.test' },
    })
    assert.equal(configuredOrigin.status, 200)
    assert.equal(
        configuredOrigin.headers.get('access-control-allow-origin'),
        'https://frontend.example.test'
    )

    const localOrigin = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: 'http://localhost:5173' },
    })
    assert.equal(localOrigin.status, 200)

    const unlistedOrigin = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: 'https://unlisted.example.test' },
    })
    assert.equal(unlistedOrigin.status, 403)

    process.env.CORS_ORIGIN = '*'
    const wildcardOrigin = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: 'https://frontend.example.test' },
    })
    assert.equal(wildcardOrigin.status, 503)
})

test('retorna health, readiness e 404 via adaptador serverless', async () => {
    const adapterServer = createHttpServer((request, response) => {
        if (request.url === '/api/auth/register' && request.method === 'POST') {
            request.body = { email: 'invalid-email' }
            request.resume()
        }
        vercelHandler(request, response)
    })
    await new Promise((resolve) => adapterServer.listen(0, '127.0.0.1', resolve))
    const adapterUrl = `http://127.0.0.1:${adapterServer.address().port}`

    try {
        const health = await fetch(`${adapterUrl}/api/health`, {
            headers: { Origin: 'http://localhost:5173' },
        })
        assert.equal(health.status, 200)
        assert.deepEqual(await health.json(), { status: 'ok' })

        const parsedBody = await fetch(`${adapterUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ignored: true }),
        })
        assert.equal(parsedBody.status, 400)
        assert.equal(
            (await parsedBody.json()).error.message,
            'Digite um e-mail válido.'
        )

        const ready = await fetch(`${baseUrl}/api/health/ready`)
        assert.equal(ready.status, 200)

        const missingRoute = await request('/api/not-found')
        assert.equal(missingRoute.response.status, 404)

        const preflight = await fetch(`${adapterUrl}/api/tasks`, {
            method: 'OPTIONS',
            headers: {
                Origin: 'http://localhost:5173',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'authorization,content-type',
            },
        })
        assert.equal(preflight.status, 204)
        assert.match(preflight.headers.get('access-control-allow-methods'), /GET, POST, PUT, DELETE, OPTIONS/)
        assert.match(preflight.headers.get('access-control-allow-headers'), /Authorization, Content-Type/)
    } finally {
        await new Promise((resolve, reject) => {
            adapterServer.close((error) => error ? reject(error) : resolve())
        })
    }
})
