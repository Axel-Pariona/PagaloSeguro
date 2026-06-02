import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <section>
      <h1>Pago recibido</h1>
      <p>
        Mercado Pago indicó que el flujo terminó correctamente. El estado final
        será confirmado mediante webhook en la siguiente fase.
      </p>

      {orderId && <Link className="primary-link" to={`/orders/${orderId}`}>Ver detalle de orden</Link>}
    </section>
  )
}