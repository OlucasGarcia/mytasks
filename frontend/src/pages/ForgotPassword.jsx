import { useState } from 'react'
import { Link } from 'react-router'
import { authService } from '../services/authService'

function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError('Digite um e-mail válido.')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            await authService.resetPassword(email.trim())
            setSubmitted(true)
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <h1 className="text-2xl font-bold text-text-primary">
                    Recuperar senha
                </h1>
                {submitted ? (
                    <p role="status" className="mt-4 text-sm text-text-secondary">
                        Se existir uma conta para esse endereço, enviaremos um link de
                        recuperação.
                    </p>
                ) : (
                    <>
                        <p className="mt-2 text-sm text-text-secondary">
                            Informe seu e-mail para receber um link seguro de recuperação.
                        </p>
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <label htmlFor="recovery-email" className="block text-sm font-medium text-text-primary">
                                E-mail
                            </label>
                            <input
                                id="recovery-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
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
                                {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
                            </button>
                        </form>
                    </>
                )}
                <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
                    Voltar para entrar
                </Link>
            </section>
        </main>
    )
}

export default ForgotPassword
