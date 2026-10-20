import { CalendarDays, Clock3, Pencil, Trash2 } from 'lucide-react'

const priorityConfig = {
    high: {
        label: 'Alta',
        style: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    },
    medium: {
        label: 'Média',
        style: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    },
    low: {
        label: 'Baixa',
        style: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    },
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
    const priority =
        priorityConfig[task.priority] ?? priorityConfig.low

    const formattedDate = task.date
        ? new Date(`${task.date}T12:00:00`).toLocaleDateString('pt-BR')
        : 'Sem data'

    return (
        <article className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md">

            <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 text-sm font-semibold text-text-primary">
                    {task.title}
                </h3>

                <div className="flex shrink-0 items-center gap-2">
                    <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${priority.style}`}
                    >
                        {priority.label}
                    </span>

                    <button
                        type="button"
                        onClick={() => onEdit(task)}
                        aria-label={`Editar ${task.title}`}
                        title="Editar tarefa"
                        className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-background hover:text-primary"
                    >
                        <Pencil size={15} />
                    </button>

                    <button
                        type="button"
                        onClick={() => onDelete(task)}
                        aria-label={`Excluir ${task.title}`}
                        title="Excluir tarefa"
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                    >
                        <Trash2 size={15} />
                    </button>

                </div>
            </div>


            {task.description && (
                <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                    {task.description}
                </p>
            )}


            <div className="mb-4">
                <label
                    htmlFor={`status-${task.id}`}
                    className="mb-1.5 block text-xs font-medium text-text-secondary"
                >
                    Status
                </label>

                <select
                    id={`status-${task.id}`}
                    value={task.status}
                    onChange={(event) =>
                        onStatusChange(task.id, event.target.value)
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-primary outline-none focus:border-primary"
                >
                    <option value="pending">A fazer</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="completed">Finalizada</option>
                </select>
            </div>


            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                    <CalendarDays size={14} />
                    {formattedDate}
                </span>

                {task.time && (
                    <span className="flex items-center gap-1">
                        <Clock3 size={14} />
                        {task.time}
                    </span>
                )}
            </div>
        </article>
    )
}

export default TaskCard
