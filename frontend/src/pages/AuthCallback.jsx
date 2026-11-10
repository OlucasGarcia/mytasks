import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../contexts/useAuth'

function AuthCallback() {
    const { user, isReady, error } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (isReady && !error) {
            navigate(user ? '/dashboard' : '/login', { replace: true })
        }
    }, [error, isReady, navigate, user])

    if (error) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
                <p role="alert" className="text-sm text-amber-600 dark:text-amber-400">
                    Não foi possível confirmar a conta. {error}
                </p>
                <Link to="/login" className="font-semibold text-primary hover:underline">
                    Ir para entrar
                </Link>
            </main>
        )
    }

    return (
        <main className="flex min-h-screen items-center justify-center gap-3 text-text-secondary">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <span className="text-sm">Confirmando sua conta...</span>
        </main>
    )
}

export default AuthCallback
