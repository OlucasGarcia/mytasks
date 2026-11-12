import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import { useAuth } from './useAuth'
import { TasksContext } from './tasks-context'
import { taskService } from '../services/taskService'

export function TasksProvider({ children }) {
    const { user } = useAuth()
    const userId = user?.id ?? null
    const [tasks, setTasks] = useState([])
    const [tasksUserId, setTasksUserId] = useState(null)
    const [loading, setLoading] = useState(Boolean(userId))
    const [error, setError] = useState(null)
    const requestId = useRef(0)

    const loadTasks = useCallback(async () => {
        if (!userId) return []

        const currentRequestId = requestId.current + 1
        requestId.current = currentRequestId
        setLoading(true)
        setError(null)

        try {
            const data = await taskService.getAll()

            if (requestId.current === currentRequestId) {
                setTasks(data)
                setTasksUserId(userId)
            }

            return data
        } catch (requestError) {
            if (requestId.current === currentRequestId) {
                setError(requestError.message)
                setTasks([])
                setTasksUserId(userId)
            }

            return []
        } finally {
            if (requestId.current === currentRequestId) {
                setLoading(false)
            }
        }
    }, [userId])

    useEffect(() => {
        let isActive = true

        queueMicrotask(() => {
            if (isActive) void loadTasks()
        })

        return () => {
            isActive = false
        }
    }, [loadTasks])

    async function addTask(taskData) {
        setError(null)

        try {
            const newTask = await taskService.create(taskData)
            setTasks((previous) => [...previous, newTask])
            setTasksUserId(userId)
            return newTask
        } catch (requestError) {
            setError(requestError.message)
            throw requestError
        }
    }

    async function updateTask(taskId, updatedData) {
        setError(null)

        try {
            const updatedTask = await taskService.update(taskId, updatedData)
            setTasks((previous) =>
                previous.map((task) =>
                    task.id === taskId ? updatedTask : task
                )
            )
            return updatedTask
        } catch (requestError) {
            setError(requestError.message)
            throw requestError
        }
    }

    async function deleteTask(taskId) {
        setError(null)

        try {
            await taskService.remove(taskId)
            setTasks((previous) =>
                previous.filter((task) => task.id !== taskId)
            )
        } catch (requestError) {
            setError(requestError.message)
            throw requestError
        }
    }

    async function updateTaskStatus(taskId, status) {
        return updateTask(taskId, { status })
    }

    return (
        <TasksContext.Provider
            value={{
                tasks: tasksUserId === userId ? tasks : [],
                loading,
                error,
                loadTasks,
                addTask,
                updateTask,
                deleteTask,
                updateTaskStatus,
            }}
        >
            {children}
        </TasksContext.Provider>
    )
}
