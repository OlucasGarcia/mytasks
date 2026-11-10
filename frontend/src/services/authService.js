import { AUTH_REFRESH_TOKEN_KEY, apiRequest } from './api'

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

    updatePassword({ currentPassword, newPassword }) {
        return apiRequest('/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        })
    },

    resetPassword(email) {
        return apiRequest('/auth/password/reset', {
            method: 'POST',
            body: JSON.stringify({ email }),
        })
    },

    completePasswordRecovery(newPassword) {
        return apiRequest('/auth/password/recovery', {
            method: 'PUT',
            body: JSON.stringify({
                newPassword,
                refreshToken: localStorage.getItem(AUTH_REFRESH_TOKEN_KEY),
            }),
        })
    },
}
