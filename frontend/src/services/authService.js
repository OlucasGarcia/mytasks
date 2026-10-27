import { apiRequest } from './api'

export const authService = {
    register(userData) {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        })
    },

    login(credentials) {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        })
    },

    getCurrentUser() {
        return apiRequest('/auth/me')
    },

    logout() {
        return apiRequest('/auth/logout', { method: 'POST' })
    },
}
