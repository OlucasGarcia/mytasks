
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const themeOptions = [
    {
        value: 'light',
        label: 'Claro',
        description: 'Aparência clara',
        icon: Sun,
    },
    {
        value: 'dark',
        label: 'Escuro',
        description: 'Aparência escura',
        icon: Moon,
    },
    {
        value: 'system',
        label: 'Automático',
        description: 'Seguir o sistema',
        icon: Monitor,
    },
]

function AppearanceSettings() {
    const { theme, setTheme } = useTheme()

    return (
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-text-primary">
                    Aparência
                </h2>

                <p className="mt-1 text-xs text-text-secondary">
                    Personalize a aparência da aplicação.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {themeOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = theme === option.value

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setTheme(option.value)}
                            aria-pressed={isSelected}
                            className={`rounded-xl border-2 p-5 text-left transition-colors ${isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <Icon
                                size={24}
                                className={
                                    isSelected
                                        ? 'text-primary'
                                        : 'text-text-secondary'
                                }
                            />

                            <h3 className="mt-4 text-sm font-semibold text-text-primary">
                                {option.label}
                            </h3>

                            <p className="mt-1 text-xs text-text-secondary">
                                {option.description}
                            </p>
                        </button>
                    )
                })}
            </div>
        </section>
    )
}

export default AppearanceSettings
