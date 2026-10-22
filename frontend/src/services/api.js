
const API_URL = import.meta.env.VITE_API_URL

export async function apiRequest(endpoint, options = {}) {
    if (!API_URL) {
        throw new Error('A URL da API não foi configurada.')
    }

    const { headers, body, ...restOptions } = options

    const response = await fetch(
        `${API_URL.replace(/\/$/, '')}${endpoint}`,
        {
            ...restOptions,
            headers: {
                ...(body != null
                    ? { 'Content-Type': 'application/json' }
                    : {}),
                ...headers,
            },
            body,
        }
    )

    if (!response.ok) {
        throw new Error(
            `Erro na API: ${response.status} ${response.statusText}`
        )
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
