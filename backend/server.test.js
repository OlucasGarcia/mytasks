import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer as createHttpServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, test } from 'node:test'
import vercelHandler from './api/[...path].js'
import { createServer } from './server.js'

let server
let temporaryDirectory
let baseUrl

beforeEach(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'mytasks-api-'))
    server = createServer({ dataFile: join(temporaryDirectory, 'data.json') })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterEach(async () => {
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
    })
    await rm(temporaryDirectory, { recursive: true, force: true })
})

async function request(path, { token, ...options } = {}) {
    const headers = { ...options.headers }

    if (options.body) {
        headers['Content-Type'] = 'application/json'
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    })
    const body = response.status === 204 ? null : await response.json()

    return { response, body }
}

async function register(email = 'ana@example.com') {
    return request('/api/auth/register', {
        method: 'POST',
        body: { name: 'Ana Silva', email, password: 'senha-segura-123' },
    })
}

test('registra, autentica e encerra uma sessão', async () => {
    const registration = await register()
    assert.equal(registration.response.status, 201)
    assert.equal(registration.body.user.email, 'ana@example.com')
    assert.ok(registration.body.token)

    const login = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'ana@example.com', password: 'senha-segura-123' },
    })
    assert.equal(login.response.status, 200)
    assert.ok(login.body.token)

    const profile = await request('/api/auth/me', { token: registration.body.token })
    assert.equal(profile.response.status, 200)
    assert.equal(profile.body.user.name, 'Ana Silva')

    const logout = await request('/api/auth/logout', {
        method: 'POST',
        token: registration.body.token,
    })
    assert.equal(logout.response.status, 204)

    const expiredProfile = await request('/api/auth/me', { token: registration.body.token })
    assert.equal(expiredProfile.response.status, 401)
})

test('impede duplicidade de e-mail e rejeita credenciais inválidas', async () => {
    await register()

    const duplicate = await register('ANA@example.com')
    assert.equal(duplicate.response.status, 409)

    const invalidLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'ana@example.com', password: 'senha-errada-123' },
    })
    assert.equal(invalidLogin.response.status, 401)
})

test('cria, atualiza e exclui tarefas sem permitir acesso entre usuários', async () => {
    const firstRegistration = await register()
    const secondRegistration = await register('bia@example.com')
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

    const otherUserTask = await request(`/api/tasks/${created.body.id}`, {
        method: 'PUT',
        token: secondRegistration.body.token,
        body: { title: 'Não autorizado' },
    })
    assert.equal(otherUserTask.response.status, 404)

    const list = await request('/api/tasks', { token })
    assert.equal(list.body.length, 1)

    const deleted = await request(`/api/tasks/${created.body.id}`, {
        method: 'DELETE',
        token,
    })
    assert.equal(deleted.response.status, 204)
})

test('valida os campos das tarefas', async () => {
    const registration = await register()
    const invalidTask = await request('/api/tasks', {
        method: 'POST',
        token: registration.body.token,
        body: { title: 'Tarefa', priority: 'urgent' },
    })

    assert.equal(invalidTask.response.status, 400)

    const invalidDate = await request('/api/tasks', {
        method: 'POST',
        token: registration.body.token,
        body: { title: 'Tarefa', date: '2026-02-31' },
    })
    assert.equal(invalidDate.response.status, 400)
})

test('adapta as requisições HTTP da Vercel e responde health e preflight', async () => {
    const adapterServer = createHttpServer(vercelHandler)
    await new Promise((resolve) => adapterServer.listen(0, '127.0.0.1', resolve))
    const adapterUrl = `http://127.0.0.1:${adapterServer.address().port}`

    try {
        const health = await fetch(`${adapterUrl}/api/health`, {
            headers: { Origin: 'http://localhost:5173' },
        })
        assert.equal(health.status, 200)
        assert.deepEqual(await health.json(), { status: 'ok' })
        assert.equal(
            health.headers.get('access-control-allow-origin'),
            'http://localhost:5173'
        )

        const preflight = await fetch(`${adapterUrl}/api/tasks`, {
            method: 'OPTIONS',
            headers: {
                Origin: 'http://localhost:5173',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'authorization,content-type',
            },
        })
        assert.equal(preflight.status, 204)
        assert.match(
            preflight.headers.get('access-control-allow-methods'),
            /GET, POST, PUT, DELETE, OPTIONS/
        )
        assert.match(
            preflight.headers.get('access-control-allow-headers'),
            /Authorization, Content-Type/
        )
    } finally {
        await new Promise((resolve, reject) => {
            adapterServer.close((error) => error ? reject(error) : resolve())
        })
    }
})

test('restringe CORS às origens configuradas sem remover origens locais', async () => {
    const previousOrigin = process.env.CORS_ORIGIN
    process.env.CORS_ORIGIN = 'https://frontend.example.test'

    try {
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
        assert.equal(
            localOrigin.headers.get('access-control-allow-origin'),
            'http://localhost:5173'
        )

        const unlistedOrigin = await fetch(`${baseUrl}/api/health`, {
            headers: { Origin: 'https://unlisted.example.test' },
        })
        assert.equal(unlistedOrigin.status, 403)
    } finally {
        if (previousOrigin === undefined) {
            delete process.env.CORS_ORIGIN
        } else {
            process.env.CORS_ORIGIN = previousOrigin
        }
    }
})

test('retorna erros JSON para corpo inválido e rota inexistente', async () => {
    const invalidJson = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
    })
    assert.equal(invalidJson.status, 400)
    assert.ok((await invalidJson.json()).error.message)

    const missingRoute = await request('/api/not-found')
    assert.equal(missingRoute.response.status, 404)
})
