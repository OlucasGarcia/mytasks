
import { CalendarDays, Clock3 } from 'lucide-react'
import { useTasks } from '../../contexts/TasksContext'

const priorityConfig = {
    high: {
        label: 'Alta',
        style: 'bg-red-100 text-red-600',
    },
    medium: {
        label: 'Média',
        style: 'bg-amber-100 text-amber-700',
    },
    low: {
        label: 'Baixa',
        style: 'bg-emerald-100 text-emerald-700',
    },
}

function UpcomingEvents() {
    const { tasks } = useTasks()

    const now = new Date()

    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('-')

    const upcomingTasks = tasks
        .filter((task) => task.date && task.date >= today)
        .sort((a, b) => {
            const dateComparison = a.date.localeCompare(b.date)

            if (dateComparison !== 0) {
                return dateComparison
            }

            return (a.time || '').localeCompare(b.time || '')
        })
        .slice(0, 6)

    function formatDate(date) {
        return new Date(`${date}T12:00:00`).toLocaleDateString(
            'pt-BR',
            {
                day: '2-digit',
                month: 'short',
            }
        )
    }

    return (
        <aside className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-text-primary">
                    Próximos eventos
                </h2>

                <p className="mt-1 text-xs text-text-secondary">
                    Acompanhe suas próximas atividades.
                </p>
            </div>

            {upcomingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <CalendarDays
                        size={36}
                        strokeWidth={1.5}
                        className="text-slate-400"
                    />

                    <p className="text-sm text-text-secondary">
                        Nenhuma tarefa futura encontrada.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {upcomingTasks.map((task) => {
                        const priority =
                            priorityConfig[task.priority] ??
                            priorityConfig.low

                        return (
                            <article
                                key={task.id}
                                className="rounded-xl border border-border bg-background p-3"
                            >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <h3 className="text-sm font-semibold text-text-primary">
                                        {task.title}
                                    </h3>

                                    <span
                                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${priority.style}`}
                                    >
                                        {priority.label}
                                    </span>
                                </div>

                                {task.category && (
                                    <p className="mb-3 text-xs text-text-secondary">
                                        {task.category}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                                    <span className="flex items-center gap-1">
                                        <CalendarDays size={14} />
                                        {formatDate(task.date)}
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
                    })}
                </div>
            )}
        </aside>
    )
}

export default UpcomingEvents
