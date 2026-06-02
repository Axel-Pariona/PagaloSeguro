import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { getOrderById } from '../services/ordersService'

export default function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadOrder() {
      try {
        setError('')
        setLoading(true)

        const data = await getOrderById({
          orderId: id,
          userId: user.id,
        })

        setOrder(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [id, user.id])

  if (loading) {
    return (
      <section>
        <h1>Detalle de orden</h1>
        <p>Cargando orden...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h1>Detalle de orden</h1>
        <p className="error-message">{error}</p>
        <Link to="/orders">Volver a mis órdenes</Link>
      </section>
    )
  }

  if (!order) {
    return (
      <section>
        <h1>Detalle de orden</h1>
        <p>No se encontró la orden solicitada.</p>
        <Link to="/orders">Volver a mis órdenes</Link>
      </section>
    )
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Detalle de orden</h1>
          <p>Información completa de la orden seleccionada.</p>
        </div>

        <Link to="/orders">Volver</Link>
      </div>

      <div className="detail-grid">
        <article className="card">
          <h3>Producto</h3>
          <p>{order.products?.name}</p>
          <small>{order.products?.description}</small>
        </article>

        <article className="card">
          <h3>Monto</h3>
          <p>
            {order.currency} {Number(order.amount).toFixed(2)}
          </p>
        </article>

        <article className="card">
          <h3>Estado</h3>
          <span className={`status-badge status-${order.status}`}>
            {order.status}
          </span>
        </article>

        <article className="card">
          <h3>Proveedor</h3>
          <p>{order.provider}</p>
        </article>

        <article className="card">
          <h3>ID de orden</h3>
          <p className="mono-text">{order.id}</p>
        </article>

        <article className="card">
          <h3>Preferencia de pago</h3>
          <p className="mono-text">
            {order.provider_preference_id || 'Todavía no generada'}
          </p>
        </article>

        <article className="card">
          <h3>ID de pago</h3>
          <p className="mono-text">
            {order.provider_payment_id || 'Todavía no registrado'}
          </p>
        </article>

        <article className="card">
          <h3>Fechas</h3>
          <p>Creada: {new Date(order.created_at).toLocaleString()}</p>
          <p>Actualizada: {new Date(order.updated_at).toLocaleString()}</p>
        </article>
      </div>

      {order.checkout_url ? (
        <div className="payment-box">
          <h3>Checkout disponible</h3>
          <p>Esta orden ya tiene una URL de checkout generada.</p>
          <a href={order.checkout_url} target="_blank" rel="noreferrer">
            Ir al checkout
          </a>
        </div>
      ) : (
        <div className="payment-box">
          <h3>Checkout pendiente</h3>
          <p>
            En la siguiente fase integraremos Mercado Pago para generar el
            checkout externo.
          </p>
        </div>
      )}
    </section>
  )
}