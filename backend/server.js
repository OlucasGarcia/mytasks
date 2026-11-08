import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { createServer as createHttpServer } from 'node:http'
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scryptAsync = promisify(scrypt)
const BACKEND_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const DEFAULT_DATA_FILE = resolve(BACKEND_DIRECTORY, 'data.json')
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
const MAX_BODY_BYTES = 1024 * 1024
const TASK_STATUSES = new Set(['pending', 'in_progress', 'completed'])
const TASK_PRIORITIES = new Set(['low', 'medium', 'high'])

class HttpError extends Error {
    constructor(status, message) {
        super(message)
        this.status = status
    }
}

function emptyStore() {
    return { users: [], tasks: [], sessions: [] }
}

function hashToken(token) {
    return createHash('sha256').update(token).digest('hex')
}

function publicUser(user) {
    return { id: user.id, name: user.name, email: user.email }
}

function getAllowedOrigins() {
    const configuredOrigins = process.env.CORS_ORIGIN ||
        'http://localhost:5173,http://127.0.0.1:5173'
    const origins = configuredOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)

    return origins.length
        ? origins
        : ['http://localhost:5173', 'http://127.0.0.1:5173']
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

async function readJsonBody(request) {
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
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('O corpo JSON precisa ser um objeto.')
        }

        return parsed
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new HttpError(400, 'O corpo da requisição contém JSON inválido.')
        }

        throw new HttpError(400, error.message)
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
        const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
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

function isValidPassword(password, storedHash, salt) {
    const actualHash = Buffer.from(storedHash, 'hex')
    return scryptAsync(password, salt, actualHash.length).then((derivedHash) =>
        timingSafeEqual(actualHash, derivedHash)
    )
}

export function createServer({ dataFile = process.env.DATA_FILE || DEFAULT_DATA_FILE } = {}) {
    const resolvedDataFile = resolve(dataFile)
    let mutationQueue = Promise.resolve()

    async function readStore() {
        try {
            await access(resolvedDataFile)
        } catch (error) {
            if (error.code === 'ENOENT') {
                return emptyStore()
            }

            throw error
        }

        const data = JSON.parse(await readFile(resolvedDataFile, 'utf8'))

        if (!data || !Array.isArray(data.users) || !Array.isArray(data.tasks) || !Array.isArray(data.sessions)) {
            throw new Error('O arquivo de dados do backend está corrompido.')
        }

        return data
    }

    async function writeStore(store) {
        await mkdir(dirname(resolvedDataFile), { recursive: true })
        const temporaryFile = `${resolvedDataFile}.${randomUUID()}.tmp`
        await writeFile(temporaryFile, JSON.stringify(store, null, 2), { mode: 0o600 })
        await rename(temporaryFile, resolvedDataFile)
    }

    function mutateStore(mutator) {
        const result = mutationQueue.then(async () => {
            const store = await readStore()
            const value = await mutator(store)
            await writeStore(store)
            return value
        })

        mutationQueue = result.then(() => undefined, () => undefined)
        return result
    }

    async function requireUser(request) {
        const authorization = request.headers.authorization || ''
        const token = authorization.startsWith('Bearer ')
            ? authorization.slice('Bearer '.length)
            : ''

        if (!token) {
            throw new HttpError(401, 'Faça login para continuar.')
        }

        const store = await readStore()
        const session = store.sessions.find((item) => item.tokenHash === hashToken(token))

        if (!session || session.expiresAt <= Date.now()) {
            throw new HttpError(401, 'Sua sessão expirou. Entre novamente.')
        }

        const user = store.users.find((item) => item.id === session.userId)

        if (!user) {
            throw new HttpError(401, 'Sua sessão não é válida. Entre novamente.')
        }

        return { store, user, session }
    }

    async function handle(request, response) {
        const requestOrigin = request.headers.origin
        const allowedOrigins = getAllowedOrigins()
        const origin = allowedOrigins.includes(requestOrigin)
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

        try {
            const url = new URL(request.url, 'http://localhost')
            const path = url.pathname.replace(/\/+$/, '') || '/'
            const method = request.method

            if (method === 'GET' && path === '/api/health') {
                sendJson(response, 200, { status: 'ok' }, origin)
                return
            }

            if (method === 'POST' && path === '/api/auth/register') {
                const credentials = validateCredentials(await readJsonBody(request), true)
                const salt = randomBytes(16).toString('hex')
                const passwordHash = (await scryptAsync(credentials.password, salt, 64)).toString('hex')
                const token = randomBytes(32).toString('base64url')
                const user = await mutateStore((store) => {
                    if (store.users.some((item) => item.email === credentials.email)) {
                        throw new HttpError(409, 'Já existe uma conta com este e-mail.')
                    }

                    const createdUser = {
                        id: randomUUID(),
                        name: credentials.name,
                        email: credentials.email,
                        passwordHash,
                        salt,
                        createdAt: new Date().toISOString(),
                    }

                    store.users.push(createdUser)
                    store.sessions.push({
                        tokenHash: hashToken(token),
                        userId: createdUser.id,
                        expiresAt: Date.now() + TOKEN_TTL_MS,
                    })

                    return publicUser(createdUser)
                })

                sendJson(response, 201, { token, user }, origin)
                return
            }

            if (method === 'POST' && path === '/api/auth/login') {
                const credentials = validateCredentials(await readJsonBody(request), false)
                const store = await readStore()
                const user = store.users.find((item) => item.email === credentials.email)
                const validPassword = user
                    ? await isValidPassword(credentials.password, user.passwordHash, user.salt)
                    : false

                if (!validPassword) {
                    throw new HttpError(401, 'E-mail ou senha incorretos.')
                }

                const token = randomBytes(32).toString('base64url')
                await mutateStore((currentStore) => {
                    currentStore.sessions = currentStore.sessions.filter(
                        (session) => session.expiresAt > Date.now()
                    )
                    currentStore.sessions.push({
                        tokenHash: hashToken(token),
                        userId: user.id,
                        expiresAt: Date.now() + TOKEN_TTL_MS,
                    })
                })

                sendJson(response, 200, { token, user: publicUser(user) }, origin)
                return
            }

            if (path === '/api/auth/me' && method === 'GET') {
                const { user } = await requireUser(request)
                sendJson(response, 200, { user: publicUser(user) }, origin)
                return
            }

            if (path === '/api/auth/logout' && method === 'POST') {
                const { session } = await requireUser(request)
                await mutateStore((store) => {
                    store.sessions = store.sessions.filter(
                        (item) => item.tokenHash !== session.tokenHash
                    )
                })
                response.writeHead(204, {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Credentials': 'true',
                    'Cache-Control': 'no-store',
                    'Vary': 'Origin',
                })
                response.end()
                return
            }

            if (path === '/api/tasks' || path.startsWith('/api/tasks/')) {
                const { user, store } = await requireUser(request)

                if (path === '/api/tasks' && method === 'GET') {
                    sendJson(
                        response,
                        200,
                        store.tasks.filter((task) => task.userId === user.id),
                        origin
                    )
                    return
                }

                if (path === '/api/tasks' && method === 'POST') {
                    const input = await readJsonBody(request)
                    const validatedTask = validateTask(input)
                    const task = await mutateStore((store) => {
                        const createdTask = {
                            ...validatedTask,
                            id: randomUUID(),
                            userId: user.id,
                            completedAt: validatedTask.status === 'completed'
                                ? new Date().toISOString()
                                : null,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        }

                        store.tasks.push(createdTask)
                        return createdTask
                    })

                    sendJson(response, 201, task, origin)
                    return
                }

                const taskId = path.slice('/api/tasks/'.length)

                if (!taskId || taskId.includes('/')) {
                    throw new HttpError(404, 'Rota não encontrada.')
                }

                if (method === 'PUT') {
                    const input = await readJsonBody(request)
                    const updatedTask = await mutateStore((store) => {
                        const task = store.tasks.find(
                            (item) => item.id === taskId && item.userId === user.id
                        )

                        if (!task) {
                            throw new HttpError(404, 'Tarefa não encontrada.')
                        }

                        const validatedTask = validateTask(input, task)
                        const previousStatus = task.status
                        Object.assign(task, validatedTask, {
                            updatedAt: new Date().toISOString(),
                        })

                        if (task.status === 'completed' && previousStatus !== 'completed') {
                            task.completedAt = task.updatedAt
                        } else if (task.status !== 'completed') {
                            task.completedAt = null
                        }

                        return task
                    })

                    sendJson(response, 200, updatedTask, origin)
                    return
                }

                if (method === 'DELETE') {
                    const deleted = await mutateStore((store) => {
                        const index = store.tasks.findIndex(
                            (item) => item.id === taskId && item.userId === user.id
                        )

                        if (index === -1) {
                            throw new HttpError(404, 'Tarefa não encontrada.')
                        }

                        store.tasks.splice(index, 1)
                        return true
                    })

                    if (deleted) {
                        response.writeHead(204, {
                            'Access-Control-Allow-Origin': origin,
                            'Access-Control-Allow-Credentials': 'true',
                            'Cache-Control': 'no-store',
                            'Vary': 'Origin',
                        })
                        response.end()
                    }
                    return
                }
            }

            throw new HttpError(404, 'Rota não encontrada.')
        } catch (error) {
            const status = error instanceof HttpError ? error.status : 500

            if (status >= 500) {
                console.error('Erro ao processar requisição:', error)
            }

            sendJson(
                response,
                status,
                { error: { message: status === 500 ? 'Erro interno do servidor.' : error.message } },
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
