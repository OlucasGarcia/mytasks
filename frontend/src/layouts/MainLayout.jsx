
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import Sidebar from '../components/layouts/Sidebar'
import Header from '../components/layouts/Header'
import { TasksProvider } from '../contexts/TasksContext'

function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Fecha com Escape e bloqueia a rolagem do fundo.
    useEffect(() => {
        if (!isSidebarOpen) return

        const previousOverflow = document.body.style.overflow

        document.body.style.overflow = 'hidden'

        function handleEscape(event) {
            if (event.key === 'Escape') {
                setIsSidebarOpen(false)
            }
        }

        document.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isSidebarOpen])

    return (
        <TasksProvider>
        <div className="flex min-h-screen bg-background">
            {/* Sidebar fixo no desktop */}
            <div className="sticky top-0 hidden h-screen shrink-0 self-start lg:block">
                <Sidebar />
            </div>

            {/* Sidebar mobile */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-80 lg:hidden">
                    {/* Fundo escurecido */}
                    <button
                        type="button"
                        aria-label="Fechar menu de navegação"
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute inset-0 bg-black/60"
                    />

                    {/* Menu lateral */}
                    <div
                        id="mobile-sidebar"
                        className="relative h-full w-60 max-w-[85vw] shadow-2xl">
                        <Sidebar
                            isMobile
                            onClose={() => setIsSidebarOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Conteúdo principal */}
            <div className="flex min-w-0 flex-1 flex-col">
                <Header
                    onMenuClick={() => setIsSidebarOpen(true)}
                    isSidebarOpen={isSidebarOpen}
                />

                <main className="flex-1 px-4 pb-8 sm:px-6">
                    <Outlet />
                </main>
            </div>
        </div>
        </TasksProvider>
    )
}

export default MainLayout
