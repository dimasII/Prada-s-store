import { useState } from 'react'
import { useCart } from '../context/CartContext'

export default function ProductCard({ producto, tallas = [] }) {
  const { agregarAlCarrito } = useCart()
  const [tallaSel, setTallaSel] = useState('')
  const [mensaje, setMensaje] = useState('')

  const imagenSrc = producto.imagen_url
    ? producto.imagen_url
    : `https://placehold.co/300x400/e2e8f0/64748b?text=${encodeURIComponent(producto.nombre)}`

  const generoLabel = { varon: '👨', mujer: '👩', unisex: '👤' }

  const handleAgregar = () => {
    if (!tallaSel) {
      setMensaje('Selecciona una talla')
      setTimeout(() => setMensaje(''), 2000)
      return
    }
    agregarAlCarrito(producto, tallaSel)
    setMensaje('✅ Agregado')
    setTimeout(() => setMensaje(''), 2000)
  }

  const tallaSelData = tallas.find(t => t.talla === tallaSel)
  const stockDisponible = tallaSelData ? tallaSelData.stock : 0
  const totalStock = tallas.reduce((s, t) => s + t.stock, 0)

  return (
    <div className="producto-card">
      <div className="producto-img-wrap">
        <img src={imagenSrc} alt={producto.nombre} />
        {producto.marca && (
          <span className="producto-marca-badge">{producto.marca}</span>
        )}
      </div>
      <div className="producto-info">
        <div className="producto-header">
          <h3>{producto.nombre}</h3>
          <span className="producto-genero">{generoLabel[producto.genero] || '👤'}</span>
        </div>
        {producto.marca && (
          <p className="producto-marca">{producto.marca}</p>
        )}
        <p className="producto-precio">${Number(producto.precio).toFixed(2)}</p>

        {tallas.length > 0 && (
          <div className="producto-tallas">
            <label>Talla:</label>
            <div className="tallas-grid">
              {tallas.map(t => (
                <button
                  key={t.talla}
                  className={`talla-btn ${tallaSel === t.talla ? 'active' : ''} ${t.stock <= 0 ? 'agotado' : ''}`}
                  onClick={() => { setTallaSel(t.talla); setMensaje('') }}
                  disabled={t.stock <= 0}
                  title={t.stock <= 0 ? 'Agotado' : `Stock: ${t.stock}`}
                >
                  {t.talla}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensaje && <p className="producto-mensaje">{mensaje}</p>}

        {totalStock > 0 && tallaSel ? (
          <button className="btn-agregar" onClick={handleAgregar}>
            Agregar al carrito
          </button>
        ) : totalStock <= 0 ? (
          <button className="btn-agregar" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            Agotado
          </button>
        ) : (
          <button className="btn-agregar btn-agregar-disabled" onClick={handleAgregar}>
            Agregar al carrito
          </button>
        )}
      </div>
    </div>
  )
}
