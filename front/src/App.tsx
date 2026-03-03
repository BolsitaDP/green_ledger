import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { useGreenLedger } from './app/GreenLedgerContext'
import { GreenLedgerProvider } from './app/GreenLedgerProvider'
import { ToastProvider } from './app/ToastProvider'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { BatchDetailPage } from './pages/BatchDetailPage'
import { BatchesPage } from './pages/BatchesPage'
import { ControlCenterPage } from './pages/ControlCenterPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NewBatchPage } from './pages/NewBatchPage'

function App() {
  return (
    <ToastProvider>
      <GreenLedgerProvider>
        <AppRoutes />
      </GreenLedgerProvider>
    </ToastProvider>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useGreenLedger()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/new-batch" element={<NewBatchPage />} />
          <Route path="/batches" element={<BatchesPage />} />
          <Route path="/batches/:batchId" element={<BatchDetailPage />} />
          <Route path="/control-center" element={<ControlCenterPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
