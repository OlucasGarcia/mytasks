
export const AUTH_TOKEN_KEY = 'mytasks-token'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export async function apiRequest(endpoint, options = {}) {
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
