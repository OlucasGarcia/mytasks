
import {
    ClipboardList,
    CircleCheck,
    Clock3,
    ChartNoAxesColumnIncreasing,
} from 'lucide-react'

import { useTasks } from '../../contexts/TasksContext'
import SummaryCard from '../../components/dashboard/SummaryCard'
import TaskStatusChart from '../../components/reports/TaskStatusChart'
import ProductivityChart from '../../components/reports/ProductivityChart'

function Reports() {
    const { tasks } = useTasks()

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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        </section>
    )
}

export default Reports
