
export const mockNotifications = [
    {
        id: 'notification-1',
        title: 'Bem-vindo ao MyTasks!',
        message: 'Organize suas atividades e acompanhe sua produtividade.',
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false,
    },
    {
        id: 'notification-2',
        title: 'Organize suas tarefas',
        message: 'Utilize o Kanban para acompanhar o andamento das atividades.',
        type: 'task',
        createdAt: new Date(
            Date.now() - 60 * 60 * 1000
        ).toISOString(),
        read: false,
    },
    {
        id: 'notification-3',
        title: 'Acompanhe seus resultados',
        message: 'Confira os indicadores de produtividade na página Relatórios.',
        type: 'success',
        createdAt: new Date(
            Date.now() - 24 * 60 * 60 * 1000
        ).toISOString(),
        read: true,
    },
]
