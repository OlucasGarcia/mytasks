
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts'

import { useTheme } from '../../contexts/ThemeContext'

const statusConfig = [
    {
        key: 'pending',
        name: 'A fazer',
        color: '#94A3B8',
    },
    {
        key: 'in_progress',
        name: 'Em andamento',
        color: '#0AB7FD',
    },
    {
        key: 'completed',
        name: 'Finalizadas',
        color: '#26EB78',
    },
]

function TaskStatusChart({ tasks }) {
    const data = statusConfig.map((status) => ({
        name: status.name,
        value: tasks.filter(
            (task) => task.status === status.key
        ).length,
        color: status.color,
    }))

    const total = tasks.length

    return (
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-text-primary">
                    Distribuição das tarefas
                </h2>

                <p className="mt-1 text-xs text-text-secondary">
                    Quantidade de tarefas por status.
                </p>
            </div>

            {total === 0 ? (
                <div className="flex h-72 items-center justify-center">
                    <p className="text-sm text-text-secondary">
                        Nenhuma tarefa disponível.
                    </p>
                </div>
            ) : (
                <div className="relative h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="45%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={3}
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>


                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--app-surface)',
                                    border: '1px solid var(--app-border)',
                                    borderRadius: '8px',
                                    color: 'var(--app-text-primary)',
                                }}
                                itemStyle={{
                                    color: 'var(--app-text-primary)',
                                }}
                            />


                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => (
                                    <span style={{ color: 'var(--app-text-secondary)' }}>
                                        {value}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute left-1/2 top-[45%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                        <span className="text-3xl font-bold text-text-primary">
                            {total}
                        </span>

                        <span className="text-xs text-text-secondary">
                            tarefas
                        </span>
                    </div>
                </div>
            )}
        </section>
    )
}

export default TaskStatusChart
