
import { useEffect, useState } from 'react'
import { Bell, CalendarClock, ListTodo } from 'lucide-react'

const STORAGE_KEY = 'mytasks-notifications'

const defaultPreferences = {
    enabled: true,
    upcomingTasks: true,
    dailySummary: false,
}

function loadPreferences() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)

        if (stored) {
            return {
                ...defaultPreferences,
                ...JSON.parse(stored),
            }
        }
    } catch (error) {
        console.error('Erro ao carregar preferências:', error)
    }

    return defaultPreferences
}

function NotificationSettings() {
    const [preferences, setPreferences] = useState(loadPreferences)

    useEffect(() => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(preferences)
        )
    }, [preferences])

    function updatePreference(key) {
        setPreferences((previous) => ({
            ...previous,
            [key]: !previous[key],
        }))
    }

    const options = [
        {
            key: 'upcomingTasks',
            title: 'Tarefas próximas',
            description: 'Receber avisos sobre tarefas agendadas.',
            icon: CalendarClock,
        },
        {
            key: 'dailySummary',
            title: 'Resumo diário',
            description: 'Receber um resumo das tarefas do dia.',
            icon: ListTodo,
        },
    ]

    return (
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-text-primary">
                    Notificações
                </h2>

                <p className="mt-1 text-xs text-text-secondary">
                    Configure suas preferências de notificações.
                </p>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
                <div className="flex items-center gap-3">
                    <Bell className="text-primary" size={22} />

                    <div>
                        <h3 className="text-sm font-medium text-text-primary">
                            Ativar notificações
                        </h3>

                        <p className="text-xs text-text-secondary">
                            Habilitar as preferências de avisos.
                        </p>
                    </div>
                </div>

                <input
                    type="checkbox"
                    checked={preferences.enabled}
                    onChange={() => updatePreference('enabled')}
                    aria-label="Ativar notificações"
                    className="h-5 w-5 cursor-pointer accent-primary"
                />
            </div>

            <div className="mt-5 space-y-6">
                {options.map((option) => {
                    const Icon = option.icon

                    return (
                        <div
                            key={option.key}
                            className="flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <Icon
                                    size={20}
                                    className="text-text-secondary"
                                />

                                <div>
                                    <h3 className="text-sm font-medium text-text-primary">
                                        {option.title}
                                    </h3>

                                    <p className="text-xs text-text-secondary">
                                        {option.description}
                                    </p>
                                </div>
                            </div>

                            <input
                                type="checkbox"
                                checked={preferences[option.key]}
                                disabled={!preferences.enabled}
                                onChange={() => updatePreference(option.key)}
                                aria-label={option.title}
                                className="h-5 w-5 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                            />
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

export default NotificationSettings
