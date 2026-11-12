
import { getSupabaseClient } from '../lib/supabase'

function mapTask(row) {
    return {
        id: row.id,
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

async function getAuthenticatedUserId(client) {
    const { data, error } = await client.auth.getUser()

    if (error) throw error
    if (!data.user) {
        throw new Error('É necessário entrar novamente para acessar as tarefas.')
    }

    return data.user.id
}

function toDatabaseTask(task) {
    const payload = {}

    for (const field of ['title', 'description', 'category', 'priority', 'status']) {
        if (field in task) {
            payload[field] = task[field]
        }
    }

    if ('date' in task) payload.date = task.date || null
    if ('time' in task) payload.time = task.time || null

    return payload
}

export const taskService = {
    async getAll() {
        const client = getSupabaseClient()
        const userId = await getAuthenticatedUserId(client)
        const { data, error } = await client
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return data.map(mapTask)
    },

    async getByPeriod(startDate, endDate) {
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
            startDate > endDate
        ) {
            throw new Error('Informe um período de datas válido.')
        }

        const client = getSupabaseClient()
        const userId = await getAuthenticatedUserId(client)
        const { data, error } = await client
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true })

        if (error) throw error

        return data.map(mapTask)
    },

    async create(taskData) {
        const client = getSupabaseClient()
        const userId = await getAuthenticatedUserId(client)
        const payload = {
            ...toDatabaseTask(taskData),
            user_id: userId,
        }

        payload.completed_at =
            taskData.status === 'completed'
                ? new Date().toISOString()
                : null

        const { data, error } = await client
            .from('tasks')
            .insert(payload)
            .select('*')
            .single()

        if (error) throw error

        return mapTask(data)
    },

    async update(taskId, taskData) {
        const client = getSupabaseClient()
        const userId = await getAuthenticatedUserId(client)
        const payload = toDatabaseTask(taskData)

        if ('status' in taskData) {
            const { data: currentTask, error: currentTaskError } = await client
                .from('tasks')
                .select('status, completed_at')
                .eq('id', taskId)
                .eq('user_id', userId)
                .maybeSingle()

            if (currentTaskError) throw currentTaskError
            if (!currentTask) throw new Error('Tarefa não encontrada.')

            if (taskData.status !== 'completed') {
                payload.completed_at = null
            } else if (currentTask.status !== 'completed') {
                payload.completed_at = new Date().toISOString()
            }
        }

        const { data, error } = await client
            .from('tasks')
            .update(payload)
            .eq('id', taskId)
            .eq('user_id', userId)
            .select('*')
            .single()

        if (error) throw error

        return mapTask(data)
    },

    async remove(taskId) {
        const client = getSupabaseClient()
        const userId = await getAuthenticatedUserId(client)
        const { data, error } = await client
            .from('tasks')
            .delete()
            .eq('id', taskId)
            .eq('user_id', userId)
            .select('id')
            .maybeSingle()

        if (error) throw error
        if (!data) throw new Error('Tarefa não encontrada.')
    },
}
