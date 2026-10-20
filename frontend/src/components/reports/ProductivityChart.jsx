
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

import { useEffect, useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

function ProductivityChart({ tasks }) {

    const { theme } = useTheme()

const [systemIsDark, setSystemIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
)

useEffect(() => {
    const mediaQuery = window.matchMedia(
        '(prefers-color-scheme: dark)'
    )

    const handleChange = (event) => {
        setSystemIsDark(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
        mediaQuery.removeEventListener('change', handleChange)
    }
}, [])

const isDark =
    theme === 'dark' ||
    (theme === 'system' && systemIsDark)

const chartColors = {
    grid: isDark ? '#344155' : '#E0E4EF',
    text: isDark ? '#94A3B8' : '#6B7280',
}


    const today = new Date()

    const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - (6 - index)
        )

        const dateKey = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
        ].join('-')

        return {
            date: dateKey,
            label: date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
            }),
            completed: 0,
        }
    })

    const completedTasks = tasks.filter(
        (task) =>
            task.status === 'completed' &&
            task.completedAt
    )

    completedTasks.forEach((task) => {
        const completedDate = new Date(task.completedAt)

        if (Number.isNaN(completedDate.getTime())) {
            return
        }

        const dateKey = [
            completedDate.getFullYear(),
            String(completedDate.getMonth() + 1).padStart(2, '0'),
            String(completedDate.getDate()).padStart(2, '0'),
        ].join('-')

        const day = lastSevenDays.find(
            (item) => item.date === dateKey
        )

        if (day) {
            day.completed += 1
        }
    })

    const totalCompleted = lastSevenDays.reduce(
        (total, day) => total + day.completed,
        0
    )

    return (
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-text-primary">
                    Produtividade semanal
                </h2>

                <p className="mt-1 text-xs text-text-secondary">
                    Tarefas concluídas nos últimos 7 dias.
                </p>
            </div>

            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={lastSevenDays}
                        margin={{
                            top: 10,
                            right: 20,
                            left: -20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={chartColors.grid}
                            vertical={false}
                        />

                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12, fill: chartColors.text }}
                            tickLine={false}
                            axisLine={false}
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: chartColors.text }}
                            tickLine={false}
                            axisLine={false}
                        />


                        <Tooltip
                            formatter={(value) => [
                                value,
                                'Tarefas concluídas',
                            ]}
                            labelFormatter={(label) => `Data: ${label}`}
                            contentStyle={{
                                backgroundColor: 'var(--app-surface)',
                                border: '1px solid var(--app-border)',
                                borderRadius: '8px',
                                color: 'var(--app-text-primary)',
                            }}
                            itemStyle={{
                                color: 'var(--app-text-primary)',
                            }}
                            labelStyle={{
                                color: 'var(--app-text-secondary)',
                            }}
                        />


                        <Line
                            type="monotone"
                            dataKey="completed"
                            name="Concluídas"
                            stroke="#0AB7FD"
                            strokeWidth={3}
                            dot={{
                                r: 4,
                                fill: '#0AB7FD',
                                strokeWidth: 2,
                                stroke: '#FFFFFF',
                            }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm text-text-secondary">
                    Total concluído nos últimos 7 dias:
                    <span className="ml-2 font-semibold text-text-primary">
                        {totalCompleted}
                    </span>
                </p>
            </div>
        </section>
    )
}

export default ProductivityChart
