import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentFailure() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <section>
      <h1>Pago no completado</h1>
      <p>
        El pago fue rechazado, cancelado o no pudo completarse. La orden sigue
        registrada para revisión.
      </p>

      {orderId && <Link to={`/orders/${orderId}`}>Ver detalle de orden</Link>}
    </section>
  )
}