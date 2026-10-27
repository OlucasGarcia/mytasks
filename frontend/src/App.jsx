import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { useAuth } from './contexts/useAuth'

import MainLayout from './layouts/MainLayout'
import Register from './pages/Register/Register'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Tasks from './pages/Tasks/Tasks'
import Calendar from './pages/Calendar/Calendar'
import Reports from './pages/Reports/Reports'
import Settings from './pages/Settings/Settings'

function RequireAuth({ children }) {
  const { user, isReady } = useAuth()

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-text-secondary">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="text-sm">Verificando sessão...</span>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />

        <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tarefas" element={<Tasks />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/configuracoes" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
