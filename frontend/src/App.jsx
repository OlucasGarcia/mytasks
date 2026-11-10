import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { useAuth } from './contexts/useAuth'

import MainLayout from './layouts/MainLayout'
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const PasswordRecovery = lazy(() => import('./pages/PasswordRecovery'))
const Register = lazy(() => import('./pages/Register/Register'))
const Login = lazy(() => import('./pages/Login/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const Tasks = lazy(() => import('./pages/Tasks/Tasks'))
const Calendar = lazy(() => import('./pages/Calendar/Calendar'))
const Reports = lazy(() => import('./pages/Reports/Reports'))
const Settings = lazy(() => import('./pages/Settings/Settings'))

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
      <Suspense
        fallback={(
          <div className="flex min-h-screen items-center justify-center gap-3 text-text-secondary">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <span className="text-sm">Carregando...</span>
          </div>
        )}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/recuperar-senha" element={<ForgotPassword />} />
          <Route path="/auth/recovery" element={<PasswordRecovery />} />

          <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tarefas" element={<Tasks />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
