
import {
    createContext,
    useContext,
    useState,
    useEffect,
} from 'react'

import { mockTasks } from '../data/mockTasks'

const TasksContext = createContext(null)

const STORAGE_KEY = 'mytasks-tasks'

function loadTasks() {
    try {
        const storedTasks = localStorage.getItem(STORAGE_KEY)

        if (storedTasks !== null) {
            const parsedTasks = JSON.parse(storedTasks)

            if (Array.isArray(parsedTasks)) {
                return parsedTasks
            }
        }
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error)
    }

    return mockTasks
}

export function TasksProvider({ children }) {
    const [tasks, setTasks] = useState(loadTasks)

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
        } catch (error) {
            console.error('Erro ao salvar tarefas:', error)
        }
    }, [tasks])


    function addTask(taskData) {
        const newTask = {
            ...taskData,
            id: crypto.randomUUID(),
            completedAt:
                taskData.status === 'completed'
                    ? new Date().toISOString()
                    : null,
        }

        setTasks((previousTasks) => [
            ...previousTasks,
            newTask,
        ])

        return newTask
    }



    function updateTask(taskId, updatedData) {
        setTasks((previousTasks) =>
            previousTasks.map((task) => {
                if (task.id !== taskId) {
                    return task
                }

                const newStatus = updatedData.status ?? task.status

                let completedAt = task.completedAt ?? null

                if (newStatus === 'completed' && task.status !== 'completed') {
                    completedAt = new Date().toISOString()
                }

                if (newStatus !== 'completed') {
                    completedAt = null
                }

                return {
                    ...task,
                    ...updatedData,
                    id: task.id,
                    completedAt,
                }
            })
        )
    }


    function deleteTask(taskId) {
        setTasks((previousTasks) =>
            previousTasks.filter((task) => task.id !== taskId)
        )
    }

    function updateTaskStatus(taskId, newStatus) {
        updateTask(taskId, { status: newStatus })
    }

    return (
        <TasksContext.Provider
            value={{
                tasks,
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

export function useTasks() {
    const context = useContext(TasksContext)

    if (context === null) {
        throw new Error(
            'useTasks deve ser utilizado dentro de TasksProvider'
        )
    }

    return context
}
