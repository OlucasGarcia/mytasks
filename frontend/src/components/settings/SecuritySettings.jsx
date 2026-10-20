
import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'

const initialForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
}

function SecuritySettings() {
    const [formData, setFormData] = useState(initialForm)
    const [showPasswords, setShowPasswords] = useState(false)
    const [error, setError] = useState('')

    function handleChange(event) {
        const { name, value } = event.target

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }))

        setError('')
    }

    function handleSubmit(event) {
        event.preventDefault()

        if (
            !formData.currentPassword ||
            !formData.newPassword ||
            !formData.confirmPassword
        ) {
            setError('Preencha todos os campos.')
            return
        }

        if (formData.newPassword.length < 8) {
            setError('A nova senha deve ter pelo menos 8 caracteres.')
            return
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('A confirmação da senha não corresponde.')
            return
        }

        if (formData.currentPassword === formData.newPassword) {
            setError('A nova senha deve ser diferente da senha atual.')
            return
        }

        setError(
            'A alteração de senha estará disponível após a integração com o servidor.'
        )
    }

    const fields = [
        {
            name: 'currentPassword',
            label: 'Senha atual',
            placeholder: 'Digite sua senha atual',
        },
        {
            name: 'newPassword',
            label: 'Nova senha',
            placeholder: 'Digite sua nova senha',
        },
        {
            name: 'confirmPassword',
            label: 'Confirmar nova senha',
            placeholder: 'Confirme sua nova senha',
        },
    ]

    return (
        <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <LockKeyhole size={22} className="text-primary" />

                    <h2 className="text-lg font-semibold text-text-primary">
                        Segurança
                    </h2>
                </div>

                <p className="mt-2 text-xs text-text-secondary">
                    Gerencie a segurança da sua conta.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
                {fields.map((field) => (
                    <div key={field.name}>
                        <label
                            htmlFor={field.name}
                            className="mb-2 block text-sm font-medium text-text-primary"
                        >
                            {field.label}
                        </label>

                        <div className="relative">
                            <input
                                id={field.name}
                                name={field.name}
                                type={showPasswords ? 'text' : 'password'}
                                value={formData[field.name]}
                                onChange={handleChange}
                                placeholder={field.placeholder}
                                autoComplete={
                                    field.name === 'currentPassword'
                                        ? 'current-password'
                                        : 'new-password'
                                }
                                className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPasswords((previous) => !previous)}
                                aria-label={
                                    showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
                            >
                                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                ))}

                {error && (
                    <p role="alert" className="text-sm text-amber-600 dark:text-amber-400">
                        {error}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        type="submit"
                        className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                    >
                        Alterar senha
                    </button>

                    <p className="text-xs text-text-secondary">
                        Funcionalidade aguardando integração com o back-end.
                    </p>
                </div>
            </form>
        </section>
    )
}

export default SecuritySettings
