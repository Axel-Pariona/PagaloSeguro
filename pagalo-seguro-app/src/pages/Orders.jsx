import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { getUserOrders } from '../services/ordersService'

export default function Orders() {
  const { user } = useAuth()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadOrders() {
      try {
        setError('')
        setLoading(true)

        const data = await getUserOrders(user.id)
        setOrders(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [user.id])

  if (loading) {
    return (
      <section>
        <h1>Mis órdenes</h1>
        <p>Cargando órdenes...</p>
      </section>
    )
  }

  return (
    <section>
      <h1>Mis órdenes</h1>
      <p>Consulta las órdenes de pago creadas con tu cuenta.</p>

      {error && <p className="error-message">{error}</p>}

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No tienes órdenes registradas todavía.</p>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.products?.name}</td>
                  <td>
                    {order.currency} {Number(order.amount).toFixed(2)}
                  </td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.provider}</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                  <td>
                    <Link to={`/orders/${order.id}`}>Ver detalle</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}