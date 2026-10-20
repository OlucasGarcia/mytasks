import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import Tasks from './pages/Tasks/Tasks'
import Calendar from './pages/Calendar/Calendar'
import Reports from './pages/Reports/Reports'
import Settings from './pages/Settings/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<MainLayout />}>
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
