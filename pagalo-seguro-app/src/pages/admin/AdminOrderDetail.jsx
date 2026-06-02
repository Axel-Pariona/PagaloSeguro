import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getAdminOrderById, syncPaymentStatus } from '../../services/adminService'

export default function AdminOrderDetail() {
  const { id } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadOrder = async () => {
    try {
      setError('')
      setLoading(true)

      const data = await getAdminOrderById(id)
      setOrder(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  const handleSync = async () => {
    try {
      setError('')
      setMessage('')
      setSyncing(true)

      const result = await syncPaymentStatus(id)

      setMessage(`Orden sincronizada. Estado actual: ${result.status ?? 'sin cambios'}`)

      await loadOrder()
    } catch (err) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <section>
        <h1>Admin · Detalle de orden</h1>
        <p>Cargando orden...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <div className="page-header">
          <div>
            <h1>Admin · Detalle de orden</h1>
            <p className="error-message">{error}</p>
          </div>

          <Link to="/admin/orders">← Volver a órdenes</Link>
        </div>
      </section>
    )
  }

  if (!order) {
    return (
      <section>
        <div className="page-header">
          <div>
            <h1>Admin · Detalle de orden</h1>
            <p>No se encontró la orden solicitada.</p>
          </div>

          <Link to="/admin/orders">← Volver a órdenes</Link>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Admin · Detalle de orden</h1>
          <p>Vista administrativa de la orden seleccionada.</p>
        </div>

        <Link to="/admin/orders">← Volver a órdenes</Link>
      </div>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <div className="detail-grid">
        <article className="card">
          <h3>Producto</h3>
          <p>{order.products?.name ?? 'Sin producto'}</p>
          <small>{order.products?.description ?? 'Sin descripción'}</small>
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
          <h3>Usuario</h3>
          <p className="mono-text">{order.user_id}</p>
          <small>{order.profiles?.full_name || 'Sin nombre registrado'}</small>
        </article>

        <article className="card">
          <h3>Preferencia de pago</h3>
          <p className="mono-text">
            {order.provider_preference_id || 'No generada'}
          </p>
        </article>

        <article className="card">
          <h3>ID de pago</h3>
          <p className="mono-text">
            {order.provider_payment_id || 'No registrado'}
          </p>
        </article>

        <article className="card">
          <h3>Fechas</h3>
          <p>Creada: {new Date(order.created_at).toLocaleString()}</p>
          <p>Actualizada: {new Date(order.updated_at).toLocaleString()}</p>
        </article>
      </div>

      <div className="payment-box">
        <h3>Acciones administrativas</h3>
        <p>
          Puedes intentar sincronizar manualmente esta orden con Mercado Pago si
          el webhook no actualizó el estado correctamente.
        </p>

        <div className="inline-actions">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || !order.provider_payment_id}
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar pago'}
          </button>

          {order.checkout_url && (
            <a href={order.checkout_url} target="_blank" rel="noreferrer">
              Abrir checkout
            </a>
          )}
        </div>

        {!order.provider_payment_id && (
          <p className="helper-text">
            Esta orden todavía no tiene provider_payment_id. La sincronización
            manual directa requiere que el webhook haya registrado al menos un ID
            de pago.
          </p>
        )}
      </div>
    </section>
  )
}