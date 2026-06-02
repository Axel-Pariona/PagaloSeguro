import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <section>
      <h1>Dashboard</h1>
      <p>Bienvenido a PagaloSeguro.</p>

      <div className="dashboard-grid">
        <article className="card">
          <h3>Usuario autenticado</h3>
          <p>{user?.email}</p>
        </article>

        <article className="card">
          <h3>Productos demo</h3>
          <p>Visualiza productos de prueba y genera órdenes pendientes.</p>
          <Link to="/products">Ver productos</Link>
        </article>

        <article className="card">
          <h3>Mis órdenes</h3>
          <p>Consulta el historial de órdenes creadas con tu cuenta.</p>
          <Link to="/orders">Ver órdenes</Link>
        </article>

        <article className="card">
          <h3>Estado del proyecto</h3>
          <p>Fase 3: productos y órdenes conectados a Supabase.</p>
        </article>
      </div>
    </section>
  )
}