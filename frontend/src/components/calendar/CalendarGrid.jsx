
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasks } from '../../contexts/TasksContext'

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function CalendarGrid() {
    const { tasks } = useTasks()
    const [currentMonth, setCurrentMonth] = useState(
        () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    )

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstWeekDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const monthLabel = currentMonth.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    })

    const today = new Date()

    function changeMonth(offset) {
        setCurrentMonth(
            (previous) =>
                new Date(
                    previous.getFullYear(),
                    previous.getMonth() + offset,
                    1
                )
        )
    }

    function goToToday() {
        const now = new Date()

        setCurrentMonth(
            new Date(now.getFullYear(), now.getMonth(), 1)
        )
    }

    const calendarDays = [
        ...Array(firstWeekDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ]

    return (
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold capitalize text-text-primary">
                    {monthLabel}
                </h2>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={goToToday}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-background"
                    >
                        Hoje
                    </button>

                    <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        aria-label="Mês anterior"
                        className="rounded-lg border border-border p-2 hover:bg-background"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        aria-label="Próximo mês"
                        className="rounded-lg border border-border p-2 hover:bg-background"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="py-3 text-center text-xs font-semibold text-text-secondary"
                    >
                        {day}
                    </div>
                ))}

                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="min-h-28 sm:min-h-32 rounded-lg bg-background/40"
                            />
                        )
                    }

                    const isToday =
                        day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear()

                    const dateKey = [
                        year,
                        String(month + 1).padStart(2, '0'),
                        String(day).padStart(2, '0'),
                    ].join('-')

                    const dayTasks = tasks
                        .filter((task) => task.date === dateKey)
                        .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

                    return (
                        <div
                            key={day}
                            className={`min-w-0 min-h-28 sm:min-h-32 rounded-lg border p-2 transition-colors ${isToday
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-surface hover:bg-background'
                                }`}
                        >
                            <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${isToday
                                        ? 'bg-primary text-white'
                                        : 'text-text-primary'
                                    }`}
                            >
                                {day}
                            </span>

                            <div className="mt-2 space-y-1">
                                {dayTasks.slice(0, 2).map((task) => (
                                    <div
                                        key={task.id}
                                        title={task.title}
                                        className={`truncate rounded px-1.5 py-1 text-[10px] font-medium ${task.status === 'completed'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : task.status === 'in_progress'
                                                ? 'bg-sky-100 text-sky-700'
                                                : 'bg-slate-100 text-slate-700'
                                            }`}
                                    >
                                        {task.time && (
                                            <span className="mr-1">{task.time}</span>
                                        )}

                                        {task.title}
                                    </div>
                                ))}

                                {dayTasks.length > 2 && (
                                    <p className="px-1 text-[10px] font-medium text-text-secondary">
                                        +{dayTasks.length - 2} tarefas
                                    </p>
                                )}
                            </div>

                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export default CalendarGrid
