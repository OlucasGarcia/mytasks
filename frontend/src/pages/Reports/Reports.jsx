
import {
    ClipboardList,
    CircleCheck,
    Clock3,
    ChartNoAxesColumnIncreasing,
    Timer,
} from 'lucide-react'

import { useTasks } from '../../contexts/useTasks'
import SummaryCard from '../../components/dashboard/SummaryCard'
import TaskStatusChart from '../../components/reports/TaskStatusChart'
import ProductivityChart from '../../components/reports/ProductivityChart'
import CategoryChart from '../../components/reports/CategoryChart'

function Reports() {
    const { tasks, loading, error } = useTasks()

    if (loading) {
        return (
            <div
                role="status"
                className="flex min-h-64 items-center justify-center gap-3 text-text-secondary"
            >
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                <span className="text-sm">Carregando relatórios...</span>
            </div>
        )
    }

    const totalTasks = tasks.length

    const completedTasks = tasks.filter(
        (task) => task.status === 'completed'
    ).length

    const pendingTasks = tasks.filter(
        (task) => task.status === 'pending'
    ).length

    const completionRate =
        totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0

    return (
        <section>
            <div className="mb-6">
                <h1 className="text-3xl font-semibold text-text-primary">
                    Relatórios
                </h1>

                <p className="mt-1 text-sm text-text-secondary">
                    Acompanhe o desempenho e a produtividade das suas tarefas.
                </p>
            </div>

            {error && (
                <p
                    role="alert"
                    className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                >
                    {error}
                </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    title="Total de tarefas"
                    value={totalTasks}
                    icon={ClipboardList}
                    iconColor="text-sky-600 dark:text-sky-400"
                    iconBackground="bg-sky-100 dark:bg-sky-500/15"
                />

                <SummaryCard
                    title="Concluídas"
                    value={completedTasks}
                    icon={CircleCheck}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    iconBackground="bg-emerald-100 dark:bg-emerald-500/15"
                />

                <SummaryCard
                    title="Pendentes"
                    value={pendingTasks}
                    icon={Clock3}
                    iconColor="text-amber-600 dark:text-amber-400"
                    iconBackground="bg-amber-100 dark:bg-amber-500/15"
                />

                <SummaryCard
                    title="Em andamento"
                    value={tasks.filter((task) => task.status === 'in_progress').length}
                    icon={Timer}
                    iconColor="text-sky-600 dark:text-sky-400"
                    iconBackground="bg-sky-100 dark:bg-sky-500/15"
                />

                <SummaryCard
                    title="Taxa de conclusão"
                    value={`${completionRate}%`}
                    icon={ChartNoAxesColumnIncreasing}
                    iconColor="text-violet-600 dark:text-violet-400"
                    iconBackground="bg-violet-100 dark:bg-violet-500/15"
                />
            </div>

            <div className="mt-6">
                <TaskStatusChart tasks={tasks} />
            </div>
            <div className="mt-6">
                <ProductivityChart tasks={tasks} />
            </div>
            <div className="mt-6">
                <CategoryChart tasks={tasks} />
            </div>
        </section>
    )
}

export default Reports
