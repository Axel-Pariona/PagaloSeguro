import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="screen-center">
        <p>Cargando sesión...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}