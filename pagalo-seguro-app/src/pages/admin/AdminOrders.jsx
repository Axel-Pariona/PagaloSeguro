import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminOrders, syncPaymentStatus } from '../../services/adminService'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncingId, setSyncingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadOrders = async () => {
    try {
      setError('')
      setLoading(true)

      const data = await getAdminOrders()
      setOrders(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleSync = async (orderId) => {
    try {
      setError('')
      setMessage('')
      setSyncingId(orderId)

      const result = await syncPaymentStatus(orderId)

      setMessage(
        `Orden sincronizada. Estado actual: ${result.status ?? 'sin cambios'}`,
      )

      await loadOrders()
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncingId(null)
    }
  }

  if (loading) {
    return (
      <section>
        <h1>Admin · Órdenes</h1>
        <p>Cargando órdenes...</p>
      </section>
    )
  }

  return (
    <section>
      <h1>Admin · Órdenes</h1>
      <p>Revisa todas las órdenes generadas en PagaloSeguro.</p>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Pago</th>
              <th>Preferencia</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.products?.name ?? 'Sin producto'}</td>
                <td>
                  {order.currency} {Number(order.amount).toFixed(2)}
                </td>
                <td>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td className="mono-text">
                  {order.provider_payment_id ?? 'Pendiente'}
                </td>
                <td className="mono-text">
                  {order.provider_preference_id ?? 'No generada'}
                </td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>
                  <div className="inline-actions">
                    <Link to={`/orders/${order.id}`}>Ver</Link>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleSync(order.id)}
                      disabled={syncingId === order.id}
                    >
                      {syncingId === order.id ? 'Sincronizando...' : 'Sync'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}