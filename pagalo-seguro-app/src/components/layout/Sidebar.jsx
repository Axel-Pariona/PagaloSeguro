import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/products">Productos demo</NavLink>
        <NavLink to="/orders">Mis órdenes</NavLink>
      </nav>
    </aside>
  )
}