
import { Plus } from 'lucide-react'
import { useTasks } from '../../contexts/TasksContext'
import TaskColumn from '../../components/tasks/TaskColumn'
import { useState } from 'react'
import TaskForm from '../../components/tasks/TaskForm'
import TaskFilters from '../../components/tasks/TaskFilters'
import ConfirmModal from '../../components/common/ConfirmModal'

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
    const [taskToDelete, setTaskToDelete] = useState(null)
    const [actionError, setActionError] = useState('')
    const [deletingTaskId, setDeletingTaskId] = useState(null)

    const {
        tasks,
        loading,
        error,
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

    async function handleSaveTask(taskData) {
        if (editingTask) {
            await updateTask(editingTask.id, taskData)
        } else {
            await addTask(taskData)
        }

        setActionError('')
    }

    function handleDelete(task) {
        if (deletingTaskId !== null) return

        setTaskToDelete(task)
    }

    async function handleConfirmDelete() {
        if (!taskToDelete || deletingTaskId !== null) return

        const taskId = taskToDelete.id

        setDeletingTaskId(taskId)
        setActionError('')

        try {
            await deleteTask(taskId)
            setTaskToDelete(null)
        } catch (error) {
            setActionError(
                error.message || 'Não foi possível excluir a tarefa.'
            )
        } finally {
            setDeletingTaskId(null)
        }
    }

    function handleCancelDelete() {
        if (deletingTaskId !== null) return

        setTaskToDelete(null)
    }

    async function handleStatusChange(taskId, status) {
        setActionError('')

        try {
            await updateTaskStatus(taskId, status)
        } catch (error) {
            setActionError(
                error.message || 'Não foi possível atualizar o status.'
            )

            throw error
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
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                        setEditingTask(null)
                        setIsFormOpen(true)
                    }}
                    disabled={loading}
                >
                    <Plus size={18} />
                    Nova tarefa
                </button>
            </div>

            {(actionError || error) && (
                <div
                    role="alert"
                    className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
                >
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {actionError || error}
                    </p>
                </div>
            )}

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

            {loading ? (
                <div
                    role="status"
                    className="flex min-h-64 items-center justify-center gap-3 text-text-secondary"
                >
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <span className="text-sm">Carregando tarefas...</span>
                </div>
            ) : (
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
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            )}

            {isFormOpen && (
                <TaskForm
                    key={editingTask?.id ?? 'new'}
                    task={editingTask}
                    onClose={handleCloseForm}
                    onSave={handleSaveTask}
                />
            )}

            <ConfirmModal
                isOpen={taskToDelete !== null}
                title="Excluir tarefa?"
                message={
                    taskToDelete
                        ? `Tem certeza que deseja excluir a tarefa "${taskToDelete.title}"? Esta ação não poderá ser desfeita.`
                        : ''
                }
                confirmLabel="Excluir tarefa"
                cancelLabel="Cancelar"
                variant="danger"
                isLoading={deletingTaskId !== null}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />

        </section>
    )
}

export default Tasks
