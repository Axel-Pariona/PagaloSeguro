import { Link } from 'react-router-dom'

export default function Dashboard() {

  return (
    <section>
      <h1>Dashboard</h1>
      <p>Bienvenido a PagaloSeguro.</p>

      <div className="dashboard-grid">
        <article className="card">
          <h3>Productos demo</h3>
          <p>Visualiza productos de prueba y genera órdenes pendientes.</p>
          <Link className="primary-link" to="/products">
            Ver productos
          </Link>
        </article>

        <article className="card">
          <h3>Mis órdenes</h3>
          <p>Consulta el historial de órdenes creadas con tu cuenta.</p>
          <Link className="primary-link" to="/orders">
            Ver órdenes
          </Link>
        </article>
      </div>
    </section>
  )
}