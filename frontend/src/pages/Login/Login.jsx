
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/useAuth'

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    const [showPassword, setShowPassword] = useState(false)
    const [formError, setFormError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { login, error: authError, clearError } = useAuth()
    const navigate = useNavigate()

    function handleChange(event) {
        const { name, value } = event.target

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }))

        setFormError('')
        clearError()
    }

    async function handleSubmit(event) {
        event.preventDefault()

        if (!formData.email.trim() || !formData.password) {
            setFormError('Preencha todos os campos.')
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setFormError('Digite um e-mail válido.')
            return
        }

        setIsSubmitting(true)
        setFormError('')

        try {
            await login({
                email: formData.email.trim(),
                password: formData.password,
            })
            navigate('/dashboard', { replace: true })
        } catch (requestError) {
            setFormError(requestError.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                        <LockKeyhole size={28} className="text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-text-primary">
                        My<span className="text-primary">Tasks</span>
                    </h1>

                    <p className="mt-2 text-sm text-text-secondary">
                        Organize suas tarefas e aumente sua produtividade.
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-semibold text-text-primary">
                        Bem-vindo de volta!
                    </h2>

                    <p className="mt-1 text-sm text-text-secondary">
                        Entre com suas credenciais para continuar.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-text-primary"
                            >
                                E-mail
                            </label>

                            <div className="relative">
                                <Mail
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                                />

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="seuemail@exemplo.com"
                                    autoComplete="email"
                                    className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-text-primary"
                            >
                                Senha
                            </label>

                            <div className="relative">
                                <LockKeyhole
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                                />

                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Digite sua senha"
                                    autoComplete="current-password"
                                    className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-12 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((previous) => !previous)}
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-primary"
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {(formError || authError) && (
                            <p
                                role="alert"
                                className="text-sm text-amber-600 dark:text-amber-400"
                            >
                                {formError || authError}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-text-secondary">
                        Ainda não possui uma conta?{' '}
                        <Link
                            to="/cadastro"
                            className="font-semibold text-primary hover:underline"
                        >
                            Cadastre-se
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-text-secondary">
                    MyTasks — Gerenciamento de tarefas
                </p>
            </div>
        </div>
    )
}

export default Login
