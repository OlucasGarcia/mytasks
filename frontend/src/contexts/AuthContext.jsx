import {
    useCallback,
    useEffect,
    useState,
} from 'react'
import { getSupabaseClient, supabase } from '../lib/supabase'
import { authService } from '../services/authService'
import { AuthContext } from './auth-context'

function mapUser(authUser) {
    if (!authUser) return null

    return {
        ...authUser,
        name:
            authUser.user_metadata?.full_name ??
            authUser.user_metadata?.name ??
            authUser.email?.split('@')[0] ??
            'Usuário',
        email: authUser.email ?? '',
    }
}

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [isReady, setIsReady] = useState(!supabase)
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
    const [error, setError] = useState(
        supabase
            ? ''
            : 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para conectar ao Supabase.'
    )

    const clearError = useCallback(() => setError(''), [])

    useEffect(() => {
        localStorage.removeItem('mytasks-token')

        if (!supabase) return undefined

        let isMounted = true
        const client = getSupabaseClient()
        const { data: { subscription } } = client.auth.onAuthStateChange(
            (event, nextSession) => {
                if (!isMounted) return

                setSession(nextSession)
                setUser(mapUser(nextSession?.user))
                setIsReady(true)

                if (event === 'PASSWORD_RECOVERY') {
                    setIsPasswordRecovery(true)
                } else if (event === 'SIGNED_OUT') {
                    setIsPasswordRecovery(false)
                }
            }
        )

        client.auth.getSession()
            .then(({ data, error: sessionError }) => {
                if (!isMounted) return

                if (sessionError) {
                    setError(sessionError.message)
                } else {
                    setSession(data.session)
                    setUser(mapUser(data.session?.user))
                }

                setIsReady(true)
            })
            .catch((sessionError) => {
                if (!isMounted) return
                setError(sessionError.message)
                setIsReady(true)
            })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [])

    const runAuthAction = useCallback(async (action) => {
        setError('')

        try {
            return await action()
        } catch (requestError) {
            setError(requestError.message)
            throw requestError
        }
    }, [])

    const login = useCallback(async (credentials) => {
        const result = await runAuthAction(
            () => authService.login(credentials)
        )
        setSession(result.session)
        setUser(mapUser(result.user))
        return result
    }, [runAuthAction])

    const register = useCallback(async (userData) => {
        const result = await runAuthAction(
            () => authService.register(userData)
        )

        if (result.session) {
            setSession(result.session)
            setUser(mapUser(result.user))
        }

        return result
    }, [runAuthAction])

    const resetPassword = useCallback(
        (email) => runAuthAction(() => authService.resetPassword(email)),
        [runAuthAction]
    )

    const updatePassword = useCallback(
        async (password) => {
            const result = await runAuthAction(
                () => authService.updatePassword(password)
            )
            setIsPasswordRecovery(false)
            return result
        },
        [runAuthAction]
    )

    const logout = useCallback(async () => {
        await runAuthAction(() => authService.logout())
        setSession(null)
        setUser(null)
        setIsPasswordRecovery(false)
    }, [runAuthAction])

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isReady,
                isPasswordRecovery,
                error,
                clearError,
                login,
                register,
                resetPassword,
                updatePassword,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
