
import { apiRequest } from './api'

export const httpTaskService = {
    getAll() {
        return apiRequest('/tasks')
    },

    create(taskData) {
        return apiRequest('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData),
        })
    },

    update(taskId, taskData) {
        return apiRequest(`/tasks/${encodeURIComponent(taskId)}`, {
            method: 'PUT',
            body: JSON.stringify(taskData),
        })
    },

    remove(taskId) {
        return apiRequest(
            `/tasks/${encodeURIComponent(taskId)}`,
            { method: 'DELETE' }
        )
    },
}
