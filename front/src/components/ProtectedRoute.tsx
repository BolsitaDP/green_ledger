import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useGreenLedger } from '../app/GreenLedgerContext'

export function ProtectedRoute() {
  const { isAuthenticated } = useGreenLedger()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
