import {
    useCallback,
    useEffect,
    useState,
} from 'react'
import { AUTH_TOKEN_KEY } from '../services/api'
import { authService } from '../services/authService'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isReady, setIsReady] = useState(
        () => !localStorage.getItem(AUTH_TOKEN_KEY)
    )
    const [error, setError] = useState('')

    const clearError = useCallback(() => setError(''), [])

    useEffect(() => {
        let isMounted = true
        const token = localStorage.getItem(AUTH_TOKEN_KEY)

        if (!token) {
            return () => {
                isMounted = false
            }
        }

        authService.getCurrentUser()
            .then(({ user: currentUser }) => {
                if (isMounted) {
                    setUser(currentUser)
                }
            })
            .catch((requestError) => {
                if (!isMounted) return

                if (requestError.status === 401) {
                    localStorage.removeItem(AUTH_TOKEN_KEY)
                } else {
                    setError(requestError.message)
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsReady(true)
                }
            })

        return () => {
            isMounted = false
        }
    }, [])

    const authenticate = useCallback(async (request) => {
        setError('')

        try {
            const result = await request()
            localStorage.setItem(AUTH_TOKEN_KEY, result.token)
            setUser(result.user)
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

    const register = useCallback(
        (userData) => authenticate(() => authService.register(userData)),
        [authenticate]
    )

    const logout = useCallback(async () => {
        setError('')

        try {
            await authService.logout()
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            localStorage.removeItem(AUTH_TOKEN_KEY)
            setUser(null)
        }
    }, [])

    return (
        <AuthContext.Provider
            value={{ user, isReady, error, clearError, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    )
}
