import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export function ProtectedRoute() {
  const { user, initialLoading } = useAuth()
  const location = useLocation()

  if (initialLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-brandGold/70">
        Memuat sesi...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

