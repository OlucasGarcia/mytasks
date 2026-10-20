
import { useState } from 'react'
import {
    Search,
    Bell,
    ChevronDown,
    UserRound,
    Settings,
    LogOut,
} from 'lucide-react'

function Header() {
    const [search, setSearch] = useState('')
    const [profileOpen, setProfileOpen] = useState(false)

    return (
        <header className="flex min-h-20 items-center justify-end gap-6 px-8 py-4">
            
            {/* Notificações */}
            <button
                type="button"
                aria-label="Notificações"
                className="relative text-slate-600 transition-colors hover:text-primary"
            >
                <Bell size={23} strokeWidth={1.8} />

                <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-red-500" />
            </button>

            {/* Perfil do usuário */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172335] text-sm font-semibold text-primary">
                        LG
                    </div>

                    <div className="text-left">
                        <p className="text-xs font-semibold text-text-primary">
                            Lucas Garcia
                        </p>
                        <p className="text-[11px] text-text-secondary">
                            Meu Negócio
                        </p>
                    </div>

                    <ChevronDown
                        size={16}
                        className={`ml-2 text-slate-600 transition-transform ${profileOpen ? 'rotate-180' : ''
                            }`}
                    />
                </button>

                {/* Menu do perfil */}
                {profileOpen && (
                    <div
                        role="menu"
                        className="absolute right-0 top-14 z-50 w-48 rounded-xl border border-border bg-white p-2 shadow-lg"
                    >
                        <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-text-primary hover:bg-background"
                        >
                            <UserRound size={17} />
                            Meu perfil
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-text-primary hover:bg-background"
                        >
                            <Settings size={17} />
                            Configurações
                        </button>

                        <div className="my-1 border-t border-border" />

                        <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-red-500 hover:bg-red-50"
                        >
                            <LogOut size={17} />
                            Sair
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Header
