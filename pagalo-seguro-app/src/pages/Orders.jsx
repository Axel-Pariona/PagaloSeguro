export default function Orders() {
  return (
    <section>
      <h1>Mis órdenes</h1>
      <p>
        Aquí se listarán las órdenes creadas por el usuario cuando integremos
        la base de datos y Mercado Pago.
      </p>

      <div className="empty-state">
        <p>No tienes órdenes registradas todavía.</p>
      </div>
    </section>
  )
}