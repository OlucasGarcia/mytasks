
import {
    useCallback,
    useEffect,
    useState,
} from 'react'

import { taskService } from '../services/taskService'
import { TasksContext } from './tasks-context'

export function TasksProvider({ children }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadTasks = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const data = await taskService.getAll()
            setTasks(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        let isMounted = true

        async function initializeTasks() {
            try {
                const data = await taskService.getAll()
                if (isMounted) {
                    setTasks(data)
                    setError(null)
                }
            } catch (err) {
                if (isMounted) setError(err.message)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        initializeTasks()

        return () => {
            isMounted = false
        }
    }, [])

    async function addTask(taskData) {
        setError(null)

        try {
            const newTask = await taskService.create(taskData)

            setTasks((previous) => [...previous, newTask])

            return newTask
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    async function updateTask(taskId, updatedData) {
        setError(null)

        try {
            const updatedTask = await taskService.update(
                taskId,
                updatedData
            )

            setTasks((previous) =>
                previous.map((task) =>
                    task.id === taskId ? updatedTask : task
                )
            )

            return updatedTask
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    async function deleteTask(taskId) {
        setError(null)

        try {
            await taskService.remove(taskId)

            setTasks((previous) =>
                previous.filter((task) => task.id !== taskId)
            )
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    async function updateTaskStatus(taskId, status) {
        return updateTask(taskId, { status })
    }

    return (
        <TasksContext.Provider
            value={{
                tasks,
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
