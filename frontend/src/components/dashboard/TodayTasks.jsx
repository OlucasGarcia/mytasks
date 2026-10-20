
import {
    ArrowRight,
    CalendarDays,
    Clock3,
    CircleCheck,
    Circle,
    LoaderCircle,
} from 'lucide-react'
import { Link } from 'react-router'

const statusConfig = {
    pending: {
        label: 'A fazer',
        icon: Circle,
        className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
    },
    in_progress: {
        label: 'Em andamento',
        icon: LoaderCircle,
        className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    },
    completed: {
        label: 'Concluída',
        icon: CircleCheck,
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    },
}

const priorityConfig = {
    high: {
        label: 'Alta',
        className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    },
    medium: {
        label: 'Média',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    },
    low: {
        label: 'Baixa',
        className: 'bg-green-100 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    },
}

function TodayTasks({ tasks = [] }) {
    const sortedTasks = [...tasks].sort((a, b) =>
        a.time.localeCompare(b.time)
    )

    return (
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary">
                        Tarefas de hoje
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary">
                        Acompanhe suas atividades programadas
                    </p>
                </div>

                <Link
                    to="/tarefas"
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                    Ver todas
                    <ArrowRight size={16} />
                </Link>
            </div>

            {sortedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <CalendarDays
                        size={36}
                        className="text-slate-400"
                        strokeWidth={1.5}
                    />
                    <p className="text-sm text-text-secondary">
                        Nenhuma tarefa programada para hoje.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedTasks.map((task) => {
                        const status =
                            statusConfig[task.status] ?? statusConfig.pending

                        const priority =
                            priorityConfig[task.priority] ?? priorityConfig.low

                        const StatusIcon = status.icon

                        return (
                            <article
                                key={task.id}
                                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-background"
                            >
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-500 dark:text-slate-300">
                                        <StatusIcon
                                            size={19}
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-text-primary">
                                            {task.title}
                                        </h3>

                                        <p className="mt-1 text-xs text-text-secondary">
                                            {task.category}
                                        </p>

                                        <div className="mt-2 flex items-center gap-1 text-xs text-text-secondary">
                                            <Clock3 size={14} />
                                            <span>{task.time}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${priority.className}`}
                                    >
                                        {priority.label}
                                    </span>

                                    <span
                                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                                    >
                                        <StatusIcon size={13} />
                                        {status.label}
                                    </span>
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default TodayTasks
