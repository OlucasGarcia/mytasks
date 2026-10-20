
import { ChartNoAxesColumn } from 'lucide-react'

const priorityConfig = [
    {
        key: 'high',
        label: 'Alta',
        color: 'bg-red-500',
    },
    {
        key: 'medium',
        label: 'Média',
        color: 'bg-amber-400',
    },
    {
        key: 'low',
        label: 'Baixa',
        color: 'bg-emerald-500',
    },
]

function PriorityChart({ tasks = [] }) {
    const total = tasks.length

    return (
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-text-primary">
                    Tarefas por prioridade
                </h2>

                <p className="mt-1 text-xs text-text-secondary">
                    Distribuição das tarefas por nível de prioridade
                </p>
            </div>

            {total === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                    <ChartNoAxesColumn
                        size={36}
                        className="text-slate-400"
                        strokeWidth={1.5}
                    />
                    <p className="text-sm text-text-secondary">
                        Nenhuma tarefa disponível.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {priorityConfig.map(({ key, label, color }) => {
                        const count = tasks.filter(
                            (task) => task.priority === key
                        ).length

                        const percentage = (count / total) * 100

                        return (
                            <div key={key}>
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-medium text-text-primary">
                                        {label}
                                    </span>

                                    <span className="text-sm text-text-secondary">
                                        {count} {count === 1 ? 'tarefa' : 'tarefas'}
                                    </span>
                                </div>

                                <div
                                    role="progressbar"
                                    aria-label={`Prioridade ${label}`}
                                    aria-valuenow={count}
                                    aria-valuemin={0}
                                    aria-valuemax={total}
                                    className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-500/50"
                                >
                                    <div
                                        className={`h-full rounded-full ${color} transition-all duration-500`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default PriorityChart
