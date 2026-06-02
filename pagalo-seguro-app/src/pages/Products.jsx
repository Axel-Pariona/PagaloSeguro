import { useEffect, useState } from 'react'

import { getActiveProducts } from '../services/productsService'
import { createCheckout } from '../services/checkoutService'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [creatingProductId, setCreatingProductId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProducts() {
      try {
        setError('')
        setLoading(true)

        const data = await getActiveProducts()
        setProducts(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const handlePay = async (productId) => {
    try {
      setError('')
      setCreatingProductId(productId)

      const checkout = await createCheckout(productId)

      window.location.href = checkout.checkout_url
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingProductId(null)
    }
  }

  if (loading) {
    return (
      <section>
        <h1>Productos demo</h1>
        <p>Cargando productos...</p>
      </section>
    )
  }

  return (
    <section>
      <h1>Productos demo</h1>
      <p>
        Selecciona un producto demo para generar una orden de pago y abrir el
        checkout de Mercado Pago.
      </p>

      {error && <p className="error-message">{error}</p>}

      {products.length === 0 ? (
        <div className="empty-state">
          <p>No hay productos disponibles.</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {products.map((product) => (
            <article className="card" key={product.id}>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>
                {product.currency} {Number(product.price).toFixed(2)}
              </strong>

              <div className="card-actions">
                <button
                  onClick={() => handlePay(product.id)}
                  disabled={creatingProductId === product.id}
                >
                  {creatingProductId === product.id
                    ? 'Generando checkout...'
                    : 'Pagar con Mercado Pago'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}