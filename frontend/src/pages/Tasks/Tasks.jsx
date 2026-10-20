
import { Plus } from 'lucide-react'
import { useTasks } from '../../contexts/TasksContext'
import TaskColumn from '../../components/tasks/TaskColumn'
import { useState } from 'react'
import TaskForm from '../../components/tasks/TaskForm'
import TaskFilters from '../../components/tasks/TaskFilters'

const columns = [
    {
        title: 'A fazer',
        status: 'pending',
        color: 'bg-slate-500',
    },
    {
        title: 'Em andamento',
        status: 'in_progress',
        color: 'bg-sky-500',
    },
    {
        title: 'Finalizadas',
        status: 'completed',
        color: 'bg-emerald-500',
    },
]

function Tasks() {

    const {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
    } = useTasks()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [search, setSearch] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')


    const categories = [
        ...new Set(
            tasks
                .map((task) => task.category?.trim())
                .filter(Boolean)
        ),
    ].sort((a, b) => a.localeCompare(b, 'pt-BR'))

    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

    const filteredTasks = tasks.filter((task) => {
        const title = (task.title ?? '').toLocaleLowerCase('pt-BR')
        const description = (task.description ?? '').toLocaleLowerCase('pt-BR')

        const matchesSearch =
            title.includes(normalizedSearch) ||
            description.includes(normalizedSearch)

        const matchesPriority =
            priorityFilter === 'all' ||
            task.priority === priorityFilter

        const matchesCategory =
            categoryFilter === 'all' ||
            task.category === categoryFilter

        return matchesSearch && matchesPriority && matchesCategory
    })

    function clearFilters() {
        setSearch('')
        setPriorityFilter('all')
        setCategoryFilter('all')
    }


    function handleEdit(task) {
        setEditingTask(task)
        setIsFormOpen(true)
    }

    function handleCloseForm() {
        setIsFormOpen(false)
        setEditingTask(null)
    }

    function handleSaveTask(taskData) {
        if (editingTask) {
            updateTask(editingTask.id, taskData)
        } else {
            addTask(taskData)
        }
    }


    function handleDelete(task) {
        const confirmed = window.confirm(
            `Tem certeza que deseja excluir a tarefa "${task.title}"?`
        )

        if (confirmed) {
            deleteTask(task.id)
        }
    }


    return (
        <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold text-text-primary">
                        Tarefas
                    </h1>

                    <p className="mt-1 text-sm text-text-secondary">
                        Organize e acompanhe suas atividades.
                    </p>
                </div>

                <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                    onClick={() => {
                        setEditingTask(null)
                        setIsFormOpen(true)
                    }}
                >
                    <Plus size={18} />
                    Nova tarefa
                </button>
            </div>

            <TaskFilters
                search={search}
                onSearchChange={setSearch}
                priority={priorityFilter}
                onPriorityChange={setPriorityFilter}
                category={categoryFilter}
                onCategoryChange={setCategoryFilter}
                categories={categories}
                onClear={clearFilters}
            />

            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
                {columns.map((column) => (
                    <TaskColumn
                        key={column.status}
                        title={column.title}
                        color={column.color}
                        tasks={filteredTasks.filter(
                            (task) => task.status === column.status
                        )}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={updateTaskStatus}
                    />
                ))}
            </div>

            {isFormOpen && (
                <TaskForm
                    key={editingTask?.id ?? 'new'}
                    task={editingTask}
                    onClose={handleCloseForm}
                    onSave={handleSaveTask}
                />
            )}

        </section>
    )
}

export default Tasks
