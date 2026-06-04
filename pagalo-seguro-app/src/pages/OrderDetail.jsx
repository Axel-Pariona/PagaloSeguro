import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { getOrderById } from '../services/ordersService'

function getPaymentMessage(status) {
  const messages = {
    pending: {
      title: 'Pago pendiente',
      description: 'Tu pago aún está pendiente. Puedes continuar con el checkout.',
    },
    approved: {
      title: 'Pago aprobado',
      description: 'Tu pago fue confirmado correctamente.',
    },
    rejected: {
      title: 'Pago rechazado',
      description: 'Mercado Pago rechazó el pago. Puedes intentar generar una nueva orden.',
    },
    cancelled: {
      title: 'Pago cancelado',
      description: 'El pago fue cancelado antes de completarse.',
    },
    expired: {
      title: 'Pago expirado',
      description: 'El intento de pago expiró. Puedes generar una nueva orden si deseas comprar nuevamente.',
    },
    refunded: {
      title: 'Pago reembolsado',
      description: 'Este pago fue reembolsado.',
    },
    error: {
      title: 'Error en la orden',
      description: 'Ocurrió un problema procesando esta orden. Si el pago fue realizado, contacta soporte.',
    },
  }

  return (
    messages[status] ?? {
      title: 'Estado desconocido',
      description: 'No se pudo interpretar el estado actual de esta orden.',
    }
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return

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
  }, [id, user?.id])

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

  const paymentMessage = getPaymentMessage(order.status)
  const canContinuePayment = order.status === 'pending' && order.checkout_url

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Detalle de orden</h1>
          <p>Consulta el estado de tu compra.</p>
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
          <h3>Orden</h3>
          <p className="mono-text">{order.id}</p>
        </article>

        <article className="card">
          <h3>Fechas</h3>
          <p>Creada: {new Date(order.created_at).toLocaleString()}</p>
          <p>Actualizada: {new Date(order.updated_at).toLocaleString()}</p>
        </article>
      </div>

      <div className="payment-box">
        <h3>{paymentMessage.title}</h3>
        <p>{paymentMessage.description}</p>

        {canContinuePayment && (
          <a href={order.checkout_url} target="_blank" rel="noreferrer">
            Continuar pago
          </a>
        )}

        {order.status === 'approved' && (
          <p className="helper-text">
            El comprobante se implementará en una fase futura.
          </p>
        )}
      </div>
    </section>
  )
}