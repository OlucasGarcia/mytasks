import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, test } from 'node:test'
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
