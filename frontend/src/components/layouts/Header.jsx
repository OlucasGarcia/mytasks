
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
    ChevronDown,
    Settings,
    LogOut,
    Menu,
} from 'lucide-react'
import NotificationPanel from './NotificationPanel'
import { useAuth } from '../../contexts/useAuth'


function Header({ onMenuClick, isSidebarOpen }) {


    const [profileOpen, setProfileOpen] = useState(false)
    const navigate = useNavigate()
    const profileRef = useRef(null)
    const { user, logout } = useAuth()

    useEffect(() => {
        if (!profileOpen) return

        function handleClickOutside(event) {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setProfileOpen(false)
            }
        }

        function handleEscape(event) {
            if (event.key === 'Escape') {
                setProfileOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [profileOpen])

    function handleNavigate(path) {
        setProfileOpen(false)
        navigate(path)
    }

    async function handleLogout() {
        setProfileOpen(false)
        await logout()
        navigate('/login', { replace: true })
    }

    const initials = user?.name
        ?.split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toLocaleUpperCase('pt-BR')

    return (
        <header className="flex min-h-20 items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:justify-end lg:gap-6 lg:px-8">
            <button
                type="button"
                onClick={onMenuClick}
                aria-label="Abrir menu de navegação"
                aria-controls="mobile-sidebar"
                aria-expanded={isSidebarOpen}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-primary transition-colors hover:bg-surface lg:hidden"
            >
                <Menu size={24} />
            </button>

            {/* Notificações */}
            <div className="flex min-w-0 items-center gap-3 sm:gap-6">
                <NotificationPanel />

                {/* Perfil do usuário */}
                <div ref={profileRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setProfileOpen(!profileOpen)}
                        aria-expanded={profileOpen}
                        aria-haspopup="menu"
                        className="flex items-center gap-3"
                        aria-controls="profile-menu"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172335] text-sm font-semibold text-primary">
                            {initials}
                        </div>

                        <div className="hidden text-left sm:block">
                            <p className="text-xs font-semibold text-text-primary">
                                {user?.name}
                            </p>
                            <p className="text-[11px] text-text-secondary">
                                {user?.email}
                            </p>
                        </div>

                        <ChevronDown
                            size={16}
                            className={`ml-2 text-text-secondary transition-transform ${profileOpen ? 'rotate-180' : ''
                                }`}
                        />
                    </button>

                    {/* Menu do perfil */}

                    {profileOpen && (
                        <div
                            id="profile-menu"
                            role="menu"
                            aria-label="Menu do usuário"
                            className="absolute right-0 top-14 z-50 w-52 rounded-xl border border-border bg-surface p-2 shadow-xl"
                        >
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleNavigate('/configuracoes')}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-text-primary transition-colors hover:bg-background hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                            >
                                <Settings size={17} />
                                Configurações
                            </button>

                            <div className="my-1 border-t border-border" />

                            {/* Sair */}
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-red-500"
                            >
                                <LogOut size={17} />
                                Sair
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </header>
    )
}

export default Header
