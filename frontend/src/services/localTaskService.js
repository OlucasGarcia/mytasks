
import { mockTasks } from '../data/mockTasks'

const STORAGE_KEY = 'mytasks-tasks'

function loadTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)

        if (stored !== null) {
            const parsed = JSON.parse(stored)

            if (Array.isArray(parsed)) {
                return parsed
            }
        }
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error)
    }

    return mockTasks
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export const localTaskService = {
    async getAll() {
        return loadTasks()
    },

    async create(taskData) {
        const tasks = loadTasks()

        const newTask = {
            ...taskData,
            id: crypto.randomUUID(),
            completedAt:
                taskData.status === 'completed'
                    ? new Date().toISOString()
                    : null,
        }

        saveTasks([...tasks, newTask])

        return newTask
    },

    async update(taskId, updatedData) {
        const tasks = loadTasks()
        let updatedTask = null

        const updatedTasks = tasks.map((task) => {
            if (task.id !== taskId) {
                return task
            }

            const newStatus = updatedData.status ?? task.status
            let completedAt = task.completedAt ?? null

            if (
                newStatus === 'completed' &&
                task.status !== 'completed'
            ) {
                completedAt = new Date().toISOString()
            }

            if (newStatus !== 'completed') {
                completedAt = null
            }

            updatedTask = {
                ...task,
                ...updatedData,
                id: task.id,
                completedAt,
            }

            return updatedTask
        })

        if (!updatedTask) {
            throw new Error('Tarefa não encontrada.')
        }

        saveTasks(updatedTasks)

        return updatedTask
    },

    async remove(taskId) {
        const tasks = loadTasks()

        saveTasks(
            tasks.filter((task) => task.id !== taskId)
        )

        return null
    },
}
