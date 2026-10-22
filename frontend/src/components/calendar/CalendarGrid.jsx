
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasks } from '../../contexts/TasksContext'

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function CalendarGrid() {
    const { tasks } = useTasks()
    const [currentMonth, setCurrentMonth] = useState(
        () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    )

    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date()

        return [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, '0'),
            String(today.getDate()).padStart(2, '0'),
        ].join('-')
    })

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
        const nextMonth = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + offset,
            1
        )

        setCurrentMonth(nextMonth)

        setSelectedDate([
            nextMonth.getFullYear(),
            String(nextMonth.getMonth() + 1).padStart(2, '0'),
            '01',
        ].join('-'))
    }

    function goToToday() {
        const now = new Date()

        setCurrentMonth(
            new Date(now.getFullYear(), now.getMonth(), 1)
        )

        setSelectedDate([
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
        ].join('-'))
    }

    const calendarDays = [
        ...Array(firstWeekDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ]

    const selectedDateTasks = tasks
        .filter((task) => task.date === selectedDate)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    const selectedDateLabel = new Date(
        `${selectedDate}T12:00:00`
    ).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    return (
        <section className="min-w-0 rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-5">
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold capitalize text-text-primary sm:text-lg">
                    {monthLabel}
                </h2>

                <div className="flex items-center gap-2 text-text-primary">
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

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="py-2 text-center text-[10px] font-semibold text-text-secondary sm:py-3 sm:text-xs"
                    >
                        <span className="sm:hidden">{day.charAt(0)}</span>
                        <span className="hidden sm:inline">{day}</span>
                    </div>
                ))}

                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="min-h-12 rounded-lg bg-background/40 sm:min-h-32"
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
                            className={`min-w-0 rounded-lg border transition-colors sm:min-h-32 ${isToday
                                ? 'border-primary bg-primary/10'
                                : 'border-border bg-surface'
                                } ${selectedDate === dateKey
                                    ? 'ring-2 ring-primary/60 sm:ring-0'
                                    : ''
                                }`}
                        >
                            {/* Versão mobile */}
                            <button
                                type="button"
                                onClick={() => setSelectedDate(dateKey)}
                                aria-label={`Selecionar dia ${day}, ${dayTasks.length} tarefas`}
                                aria-pressed={selectedDate === dateKey}
                                className="flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-lg p-1 transition-colors hover:bg-background sm:hidden"
                            >
                                <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${isToday
                                        ? 'bg-primary text-white'
                                        : 'text-text-primary'
                                        }`}
                                >
                                    {day}
                                </span>

                                {dayTasks.length > 0 && (
                                    <span className="flex items-center justify-center gap-0.5">
                                        {dayTasks.slice(0, 3).map((task) => (
                                            <span
                                                key={task.id}
                                                className={`h-1.5 w-1.5 rounded-full ${task.status === 'completed'
                                                    ? 'bg-emerald-500'
                                                    : task.status === 'in_progress'
                                                        ? 'bg-sky-500'
                                                        : 'bg-slate-400'
                                                    }`}
                                            />
                                        ))}
                                    </span>
                                )}
                            </button>

                            {/* Versão tablet e desktop */}
                            <div className="hidden p-2 sm:block">
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
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                                : task.status === 'in_progress'
                                                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300'
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
                        </div>
                    )

                })}
            </div>

            {/* Tarefas da data selecionada - somente mobile */}
            <div className="mt-6 border-t border-border pt-5 sm:hidden">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold capitalize text-text-primary">
                        {selectedDateLabel}
                    </h3>

                    <span className="rounded-full bg-background px-2.5 py-1 text-xs font-medium text-text-secondary">
                        {selectedDateTasks.length}
                        {selectedDateTasks.length === 1 ? ' tarefa' : ' tarefas'}
                    </span>
                </div>

                {selectedDateTasks.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-text-secondary">
                        Nenhuma tarefa para esta data.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {selectedDateTasks.map((task) => (
                            <div
                                key={task.id}
                                className="rounded-lg border border-border bg-background p-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="min-w-0 flex-1 break-word text-sm font-medium text-text-primary">
                                        {task.title}
                                    </p>

                                    <span
                                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${task.status === 'completed'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                                : task.status === 'in_progress'
                                                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300'
                                            }`}
                                    >
                                        {task.status === 'completed'
                                            ? 'Finalizada'
                                            : task.status === 'in_progress'
                                                ? 'Em andamento'
                                                : 'A fazer'}
                                    </span>
                                </div>

                                {task.description && (
                                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                                        {task.description}
                                    </p>
                                )}

                                {task.time && (
                                    <p className="mt-2 text-xs text-text-secondary">
                                        Horário: {task.time}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </section>
    )
}

export default CalendarGrid
