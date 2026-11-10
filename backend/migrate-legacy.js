import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BACKEND_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const LEGACY_DATA_FILE = resolve(
    process.env.LEGACY_DATA_FILE || resolve(BACKEND_DIRECTORY, 'data.json')
)
const BATCH_SIZE = 500

function assertLegacyStore(value) {
    if (
        !value ||
        !Array.isArray(value.users) ||
        !Array.isArray(value.tasks) ||
        !Array.isArray(value.sessions)
    ) {
        throw new Error('O arquivo legado não possui o formato de dados esperado.')
    }

    const userIds = new Set(value.users.map((user) => user.id))

    for (const task of value.tasks) {
        if (!task.id || !userIds.has(task.userId)) {
            throw new Error('Há tarefas sem um proprietário legado válido; nenhuma tarefa foi importada.')
        }
    }

    return value
}

async function loadLegacyData() {
    const contents = await readFile(LEGACY_DATA_FILE, 'utf8')
    return assertLegacyStore(JSON.parse(contents.replace(/^\uFEFF/, '')))
}

async function listAllUsers(client) {
    const users = []
    const perPage = 1000

    for (let page = 1; ; page += 1) {
        const { data, error } = await client.auth.admin.listUsers({ page, perPage })

        if (error) {
            throw new Error(`Não foi possível consultar os usuários confirmados: ${error.message}`)
        }

        users.push(...data.users)
        if (data.users.length < perPage) return users
    }
}

async function main() {
    const legacy = await loadLegacyData()

    if (process.argv.includes('--dry-run')) {
        console.log(`Validação local concluída: ${legacy.users.length} contas e ${legacy.tasks.length} tarefas encontradas.`)
        console.log('Nenhum dado foi enviado; hashes de senha e sessões não são importados.')
        return
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY apenas no ambiente local seguro para esta importação.')
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
        },
    })
    const legacyEmails = new Map()
    const seenEmails = new Set()

    for (const user of legacy.users) {
        const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : ''
        if (!email || legacyEmails.has(user.id) || seenEmails.has(email)) {
            throw new Error('Há contas legadas inválidas; nenhuma tarefa foi importada.')
        }
        legacyEmails.set(user.id, email)
        seenEmails.add(email)
    }

    const confirmedUsers = await listAllUsers(client)
    const authUsersByEmail = new Map()

    for (const user of confirmedUsers) {
        if (!user.email || !user.email_confirmed_at) continue

        const email = user.email.trim().toLowerCase()
        if (authUsersByEmail.has(email)) {
            throw new Error('Há contas Supabase ambíguas para um e-mail legado; nenhuma tarefa foi importada.')
        }
        authUsersByEmail.set(email, user)
    }

    const rows = legacy.tasks.map((task) => {
        const email = legacyEmails.get(task.userId)
        const authUser = authUsersByEmail.get(email)

        if (!authUser) {
            throw new Error('Cada conta legada precisa se cadastrar e confirmar o mesmo e-mail antes da importação. Nenhuma tarefa foi importada.')
        }

        return {
            id: task.id,
            user_id: authUser.id,
            title: task.title,
            description: task.description ?? '',
            category: task.category ?? '',
            priority: task.priority,
            status: task.status,
            date: task.date || null,
            time: task.time || null,
            completed_at: task.completedAt ?? null,
            created_at: task.createdAt,
            updated_at: task.updatedAt,
        }
    })

    let imported = 0

    for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
        const batch = rows.slice(offset, offset + BATCH_SIZE)
        const { data: existingTasks, error: existingTasksError } = await client
            .from('tasks')
            .select('id,user_id')
            .in('id', batch.map((task) => task.id))

        if (existingTasksError) {
            throw new Error(`Não foi possível verificar conflitos antes da importação: ${existingTasksError.message}`)
        }

        const ownersById = new Map(batch.map((task) => [task.id, task.user_id]))
        if (existingTasks.some((task) => ownersById.get(task.id) !== task.user_id)) {
            throw new Error('Foi encontrado um ID de tarefa já associado a outra conta; nenhuma alteração foi feita neste lote.')
        }

        const { data, error } = await client
            .from('tasks')
            .upsert(batch, { onConflict: 'id', ignoreDuplicates: true })
            .select('id')

        if (error) {
            throw new Error(`A importação parou antes de concluir. Pode ser reexecutada com segurança: ${error.message}`)
        }

        imported += data.length
    }

    console.log(`Importação concluída: ${imported} tarefas adicionadas; ${rows.length - imported} já existiam e foram preservadas.`)
    console.log('Contas, hashes de senha e sessões legadas não foram importados.')
}

main().catch((error) => {
    console.error(`Falha na importação de tarefas: ${error.message}`)
    process.exitCode = 1
})
