
import {
    ClipboardList,
    Clock3,
    Timer,
    CircleCheck,
} from 'lucide-react'

import PriorityChart from '../../components/dashboard/PriorityChart'
import TodayTasks from '../../components/dashboard/TodayTasks'
import SummaryCard from '../../components/dashboard/SummaryCard'
import { useTasks } from '../../contexts/TasksContext'

function Dashboard() {
    const { tasks } = useTasks()

    const totalTasks = tasks.length

    const pendingTasks = tasks.filter(
        (task) => task.status === 'pending'
    ).length

    const inProgressTasks = tasks.filter(
        (task) => task.status === 'in_progress'
    ).length

    const completedTasks = tasks.filter(
        (task) => task.status === 'completed'
    ).length

    const today = new Date().toLocaleDateString('en-CA')

    const todayTasks = tasks.filter(
        (task) => task.date === today
    )

    return (
        <section>
            <div className="mb-6">
                <h1 className="text-3xl font-semibold text-text-primary">
                    Olá, Lucas! 👋
                </h1>

                <p className="mt-1 text-sm text-text-secondary">
                    Aqui está um resumo das suas tarefas de hoje.
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
                    title="Pendentes"
                    value={pendingTasks}
                    icon={Clock3}
                    iconColor="text-violet-500 dark:text-violet-400"
                    iconBackground="bg-violet-100 dark:bg-violet-500/15"
                />

                <SummaryCard
                    title="Em andamento"
                    value={inProgressTasks}
                    icon={Timer}
                    iconColor="text-sky-600 dark:text-sky-400"
                    iconBackground="bg-sky-100 dark:bg-sky-500/15"
                />

                <SummaryCard
                    title="Concluídas"
                    value={completedTasks}
                    icon={CircleCheck}
                    iconColor="text-emerald-500 dark:text-emerald-400"
                    iconBackground="bg-emerald-100 dark:bg-emerald-500/15"
                />
            </div>
            <div className="mt-6">
                <TodayTasks tasks={todayTasks} />
            </div>
            <div className="mt-6">
                <PriorityChart tasks={tasks} />
            </div>
        </section>
    )
}

export default Dashboard
