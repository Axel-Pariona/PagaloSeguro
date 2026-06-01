import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { getActiveProducts } from '../services/productsService'
import { createPendingOrder } from '../services/ordersService'

export default function Products() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [creatingOrderId, setCreatingOrderId] = useState(null)
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

  const handleCreateOrder = async (product) => {
    try {
      setError('')
      setCreatingOrderId(product.id)

      const order = await createPendingOrder({
        userId: user.id,
        product,
      })

      navigate(`/orders/${order.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingOrderId(null)
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
        Selecciona un producto demo para generar una orden de pago pendiente.
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
                  onClick={() => handleCreateOrder(product)}
                  disabled={creatingOrderId === product.id}
                >
                  {creatingOrderId === product.id
                    ? 'Creando orden...'
                    : 'Crear orden'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}