import {
    useCallback,
    useEffect,
    useState,
} from 'react'
import {
    AUTH_TOKEN_KEY,
    clearAuthSession,
    saveAuthSession,
} from '../services/api'
import { authService } from '../services/authService'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isReady, setIsReady] = useState(
        () => !localStorage.getItem(AUTH_TOKEN_KEY) && !window.location.hash
    )
    const [error, setError] = useState('')
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

    const clearError = useCallback(() => setError(''), [])

    useEffect(() => {
        let isMounted = true

        async function initializeSession() {
            const callbackParams = new URLSearchParams(window.location.hash.slice(1))
            const callbackToken = callbackParams.get('access_token')
            const callbackRefreshToken = callbackParams.get('refresh_token')
            const callbackError = callbackParams.get('error_description')

            if (callbackParams.get('type') === 'recovery') {
                setIsPasswordRecovery(true)
            }

            if (callbackToken && callbackRefreshToken) {
                saveAuthSession({
                    token: callbackToken,
                    refreshToken: callbackRefreshToken,
                    expiresAt: Number(callbackParams.get('expires_at')) || undefined,
                })
                window.history.replaceState(
                    null,
                    document.title,
                    `${window.location.pathname}${window.location.search}`
                )
            } else if (callbackError) {
                setError(callbackError)
                window.history.replaceState(
                    null,
                    document.title,
                    `${window.location.pathname}${window.location.search}`
                )
            }

            if (!localStorage.getItem(AUTH_TOKEN_KEY)) return

            try {
                const { user: currentUser } = await authService.getCurrentUser()
                if (isMounted) setUser(currentUser)
            } catch (requestError) {
                if (!isMounted) return

                if (requestError.status === 401) {
                    clearAuthSession()
                } else {
                    setError(requestError.message)
                }
            }
        }

        initializeSession()
            .catch((requestError) => {
                if (isMounted) setError(requestError.message)
            })
            .finally(() => {
                if (isMounted) setIsReady(true)
            })

        return () => {
            isMounted = false
        }
    }, [])

    const authenticate = useCallback(async (request) => {
        setError('')

        try {
            const result = await request()
            saveAuthSession(result)
            setUser(result.user)
            setIsPasswordRecovery(false)
            return result.user
        } catch (requestError) {
            setError(requestError.message)
            throw requestError
        }
    }, [])

    const login = useCallback(
        (credentials) => authenticate(() => authService.login(credentials)),
        [authenticate]
    )

    const register = useCallback(async (userData) => {
        setError('')

        try {
            const result = await authService.register(userData)

            if (result.token) {
                saveAuthSession(result)
                setUser(result.user)
                setIsPasswordRecovery(false)
            }

            return result
        } catch (requestError) {
            setError(requestError.message)
            throw requestError
        }
    }, [])

    const logout = useCallback(async () => {
        setError('')

        try {
            await authService.logout()
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            clearAuthSession()
            setUser(null)
            setIsPasswordRecovery(false)
        }
    }, [])

    return (
        <AuthContext.Provider
            value={{
                user,
                isReady,
                error,
                isPasswordRecovery,
                clearError,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
