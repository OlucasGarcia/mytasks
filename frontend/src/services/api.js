export const AUTH_TOKEN_KEY = 'mytasks-token'
export const AUTH_REFRESH_TOKEN_KEY = 'mytasks-refresh-token'
export const AUTH_EXPIRES_AT_KEY = 'mytasks-token-expires-at'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
let refreshPromise

export function saveAuthSession(session) {
    if (!session?.token || !session?.refreshToken) {
        throw new Error('O serviço de autenticação retornou uma sessão inválida.')
    }

    localStorage.setItem(AUTH_TOKEN_KEY, session.token)
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, session.refreshToken)
    localStorage.setItem(AUTH_EXPIRES_AT_KEY, String(session.expiresAt || ''))
}

export function clearAuthSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
    localStorage.removeItem(AUTH_EXPIRES_AT_KEY)
}

function isRefreshableEndpoint(endpoint) {
    return ![
        '/auth/login',
        '/auth/register',
        '/auth/refresh',
    ].includes(endpoint)
}

async function refreshAuthSession(rejectedToken) {
    if (localStorage.getItem(AUTH_TOKEN_KEY) !== rejectedToken) {
        return Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
    }

    if (!refreshPromise) {
        const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)

        if (!refreshToken) {
            clearAuthSession()
            return false
        }

        refreshPromise = fetch(`${API_URL.replace(/\/$/, '')}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        })
            .then(async (response) => {
                if (!response.ok) {
                    clearAuthSession()
                    return false
                }

                const session = await response.json()
                saveAuthSession(session)
                return true
            })
            .finally(() => {
                refreshPromise = undefined
            })
    }

    return refreshPromise
}

async function sendRequest(endpoint, options, retryAfterRefresh = true) {
    const { headers, body, ...restOptions } = options
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const response = await fetch(`${API_URL.replace(/\/$/, '')}${endpoint}`, {
        ...restOptions,
        headers: {
            ...(body != null ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body,
    })

    if (
        response.status === 401 &&
        token &&
        retryAfterRefresh &&
        isRefreshableEndpoint(endpoint) &&
        await refreshAuthSession(token)
    ) {
        return sendRequest(endpoint, options, false)
    }

    return response
}

export async function apiRequest(endpoint, options = {}) {
    const response = await sendRequest(endpoint, options)

    if (!response.ok) {
        let message = `Erro na API: ${response.status} ${response.statusText}`

        try {
            const errorBody = await response.json()
            message = errorBody.error?.message || message
        } catch {
            // Mantém a mensagem HTTP quando a resposta não contém JSON.
        }

        const error = new Error(message)
        error.status = response.status
        throw error
    }

    if (response.status === 204) {
        return null
    }

    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
        return response.json()
    }

    return response.text()
}
