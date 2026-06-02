import { useEffect, useState } from 'react'
import { getPaymentEvents } from '../../services/adminService'

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadEvents() {
      try {
        setError('')
        setLoading(true)

        const data = await getPaymentEvents()
        setEvents(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  if (loading) {
    return (
      <section>
        <h1>Admin · Eventos</h1>
        <p>Cargando eventos...</p>
      </section>
    )
  }

  return (
    <section>
      <h1>Admin · Eventos</h1>
      <p>Eventos recibidos desde Mercado Pago.</p>

      {error && <p className="error-message">{error}</p>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Evento</th>
              <th>ID proveedor</th>
              <th>Procesado</th>
              <th>Error</th>
              <th>Orden</th>
              <th>Fecha</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.event_type}</td>
                <td className="mono-text">
                  {event.provider_event_id ?? 'Sin ID'}
                </td>
                <td>
                  <span
                    className={`status-badge ${
                      event.processed ? 'status-approved' : 'status-pending'
                    }`}
                  >
                    {event.processed ? 'Procesado' : 'Pendiente'}
                  </span>
                </td>
                <td>{event.error_message ?? 'Sin error'}</td>
                <td className="mono-text">{event.order_id ?? 'No asociada'}</td>
                <td>{new Date(event.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}