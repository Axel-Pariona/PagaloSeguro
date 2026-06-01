import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="screen-center">
      <div>
        <h1>404</h1>
        <p>La página que buscas no existe.</p>
        <Link to="/dashboard">Volver al dashboard</Link>
      </div>
    </section>
  )
}