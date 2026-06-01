export default function Products() {
  return (
    <section>
      <h1>Productos demo</h1>
      <p>
        En esta sección luego mostraremos los productos o servicios de prueba
        para generar órdenes de pago.
      </p>

      <div className="dashboard-grid">
        <article className="card">
          <h3>Curso React Básico</h3>
          <p>S/ 20.00</p>
          <button disabled>Pagar próximamente</button>
        </article>

        <article className="card">
          <h3>Plantilla Dashboard</h3>
          <p>S/ 35.00</p>
          <button disabled>Pagar próximamente</button>
        </article>

        <article className="card">
          <h3>Asesoría Demo</h3>
          <p>S/ 50.00</p>
          <button disabled>Pagar próximamente</button>
        </article>
      </div>
    </section>
  )
}