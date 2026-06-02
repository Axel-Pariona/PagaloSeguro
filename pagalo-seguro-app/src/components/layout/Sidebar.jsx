import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { isAdmin } = useAuth()

  return (
    <aside className="sidebar">
      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/products">Productos demo</NavLink>
        <NavLink to="/orders">Mis órdenes</NavLink>

        {isAdmin && (
          <>
            <div className="sidebar-section">Admin</div>
            <NavLink to="/admin/orders">Órdenes</NavLink>
            <NavLink to="/admin/events">Eventos</NavLink>
            <NavLink to="/admin/logs">Logs</NavLink>
          </>
        )}
      </nav>
    </aside>
  )
}