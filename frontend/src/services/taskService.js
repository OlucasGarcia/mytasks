
import { localTaskService } from './localTaskService'
import { httpTaskService } from './httpTaskService'

const dataSource = import.meta.env.VITE_DATA_SOURCE || 'local'

export const taskService =
    dataSource === 'api'
        ? httpTaskService
        : localTaskService
