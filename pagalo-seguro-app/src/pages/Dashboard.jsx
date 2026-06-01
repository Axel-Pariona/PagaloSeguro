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
          <h3>Órdenes</h3>
          <p>Próximamente verás aquí tus órdenes de pago.</p>
        </article>

        <article className="card">
          <h3>Estado del proyecto</h3>
          <p>Fase 1: Setup base y autenticación.</p>
        </article>
      </div>
    </section>
  )
}