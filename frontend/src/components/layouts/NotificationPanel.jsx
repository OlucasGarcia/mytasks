
import { useEffect, useRef, useState } from 'react'
import {
    Bell,
    CircleCheck,
    ClipboardList,
    X,
} from 'lucide-react'

const notificationIcons = {
    task: ClipboardList,
    success: CircleCheck,
}

function NotificationPanel() {
    const notifications = []
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    const unreadCount = notifications.filter(
        (notification) => !notification.read
    ).length

    useEffect(() => {
        if (!isOpen) return

        function handleOutsideClick(event) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false)
            }
        }

        function handleEscape(event) {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('pointerdown', handleOutsideClick)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('pointerdown', handleOutsideClick)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen])

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((previous) => !previous)}
                aria-label="Notificações"
                aria-expanded={isOpen}
                aria-controls="notification-panel"
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background hover:text-primary"
            >
                <Bell size={21} />

                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    id="notification-panel"
                    role="region"
                    aria-label="Painel de notificações"
                    className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
                >
                    <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                        <div>
                            <h2 className="text-base font-semibold text-text-primary">
                                Notificações
                            </h2>

                            <p className="text-xs text-text-secondary">
                                {unreadCount === 0
                                    ? 'Nenhuma notificação não lida'
                                    : `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Fechar notificações"
                            className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text-primary"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center px-5 py-12 text-center">
                            <div className="mb-4 rounded-full bg-background p-4">
                                <Bell size={26} className="text-text-secondary" />
                            </div>

                            <p className="text-sm font-medium text-text-primary">
                                Nenhuma notificação
                            </p>

                            <p className="mt-1 text-xs text-text-secondary">
                                Quando houver novos avisos, eles aparecerão aqui.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.map((notification) => {
                                    const Icon =
                                        notificationIcons[notification.type] ?? Bell

                                    return (
                                        <button
                                            key={notification.id}
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className={`flex w-full gap-3 border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-background ${notification.read
                                                    ? ''
                                                    : 'bg-primary/5'
                                                }`}
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Icon size={18} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="text-sm font-semibold text-text-primary">
                                                        {notification.title}
                                                    </h3>

                                                    {!notification.read && (
                                                        <span
                                                            aria-label="Não lida"
                                                            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                                                        />
                                                    )}
                                                </div>

                                                <p className="mt-1 text-xs leading-5 text-text-secondary">
                                                    {notification.message}
                                                </p>

                                                <p className="mt-2 text-[11px] text-text-secondary">
                                                    {new Date(
                                                        notification.createdAt
                                                    ).toLocaleString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default NotificationPanel
