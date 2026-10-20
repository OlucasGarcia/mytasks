
import { Outlet } from 'react-router'
import Sidebar from '../components/layouts/Sidebar'
import Header from '../components/layouts/Header'

function MainLayout() {
    return (
        <div className="flex min-h-screen bg-background">
            <div className="sticky top-0 h-screen shrink-0 self-start">
                <Sidebar />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <Header />

                <main className="flex-1 px-6 pb-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default MainLayout
