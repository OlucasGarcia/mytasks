import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../contexts/useAuth'
import { clearAuthSession } from '../services/api'
import { authService } from '../services/authService'

function PasswordRecovery() {
    const { isReady, isPasswordRecovery } = useAuth()
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [completed, setCompleted] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()

        if (password.length < 8 || password.length > 128) {
            setError('A senha deve ter entre 8 e 128 caracteres.')
            return
        }
        if (password !== confirmation) {
            setError('As senhas não correspondem.')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            await authService.completePasswordRecovery(password)
            clearAuthSession()
            setCompleted(true)
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isReady) {
        return (
            <main className="flex min-h-screen items-center justify-center gap-3 text-text-secondary">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                <span className="text-sm">Validando link...</span>
            </main>
        )
    }

    if (completed) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
                <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                    <p role="status" className="text-sm text-text-secondary">
                        Senha atualizada. Entre novamente com sua nova senha.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/login', { replace: true })}
                        className="mt-6 font-semibold text-primary hover:underline"
                    >
                        Ir para entrar
                    </button>
                </section>
            </main>
        )
    }

    if (!isPasswordRecovery) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
                <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                    <p role="alert" className="text-sm text-amber-600 dark:text-amber-400">
                        O link de recuperação é inválido ou expirou.
                    </p>
                    <Link to="/recuperar-senha" className="mt-6 inline-block font-semibold text-primary hover:underline">
                        Solicitar outro link
                    </Link>
                </section>
            </main>
        )
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <h1 className="text-2xl font-bold text-text-primary">
                    Definir nova senha
                </h1>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label htmlFor="new-password" className="block text-sm font-medium text-text-primary">
                        Nova senha
                    </label>
                    <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={128}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
                    />
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-text-primary">
                        Confirmar nova senha
                    </label>
                    <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={128}
                        value={confirmation}
                        onChange={(event) => setConfirmation(event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
                    />
                    {error && (
                        <p role="alert" className="text-sm text-amber-600 dark:text-amber-400">
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'Atualizando...' : 'Atualizar senha'}
                    </button>
                </form>
            </section>
        </main>
    )
}

export default PasswordRecovery
