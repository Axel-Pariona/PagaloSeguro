import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentPending() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <section>
      <h1>Pago pendiente</h1>
      <p>
        El pago quedó pendiente de confirmación. Cuando Mercado Pago confirme el
        estado, el sistema actualizará la orden.
      </p>

      {orderId && <Link className="primary-link" to={`/orders/${orderId}`}>Ver detalle de orden</Link>}
    </section>
  )
}