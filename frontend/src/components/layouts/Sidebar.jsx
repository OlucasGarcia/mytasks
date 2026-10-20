
import { NavLink } from 'react-router'
import {
    House,
    ClipboardList,
    CalendarDays,
    ChartNoAxesColumn,
    Settings,
    LogOut,
    SquareCheckBig,
} from 'lucide-react'

const menuItems = [
    {
        label: 'Dashboard',
        path: '/dashboard',
        icon: House,
    },
    {
        label: 'Tarefas',
        path: '/tarefas',
        icon: ClipboardList,
    },
    {
        label: 'Calendário',
        path: '/calendario',
        icon: CalendarDays,
    },
    {
        label: 'Relatórios',
        path: '/relatorios',
        icon: ChartNoAxesColumn,
    },
    {
        label: 'Configurações',
        path: '/configuracoes',
        icon: Settings,
    },
]

function Sidebar() {
    return (
        <aside className="flex h-screen w-60 shrink-0 flex-col bg-[#172335] px-3 py-5 text-white">
            {/* Logo */}
            <div className="mb-9 flex items-center gap-2 px-2">
                <SquareCheckBig
                    size={35}
                    strokeWidth={3}
                    className="text-primary"
                />

                <h1 className="text-[23px] font-semibold tracking-tight">
                    My<span className="text-primary">Tasks</span>
                </h1>
            </div>

            {/* Navegação */}
            <nav
                aria-label="Menu principal"
                className="flex flex-1 flex-col gap-2"
            >
                {menuItems.map(({ label, path, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${isActive
                                ? 'bg-primary font-medium text-white'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`
                        }
                    >
                        <Icon size={20} strokeWidth={1.8} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Rodapé */}
            <div className="border-t border-white/15 pt-4">
                <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                    <LogOut size={20} strokeWidth={1.8} />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
