import { useState } from 'react'
import { useCart } from '../context/CartContext'

export default function ProductCard({ producto, tallas = [], imagenes = [] }) {
  const { agregarAlCarrito } = useCart()
  const [tallaSel, setTallaSel] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [imgIndex, setImgIndex] = useState(0)

  const todasLasImagenes = [
    ...imagenes.map(i => i.url).filter(Boolean),
    producto.imagen_url,
    `https://placehold.co/300x400/e2e8f0/64748b?text=${encodeURIComponent(producto.nombre)}`,
  ].filter(Boolean)

  const primerIndex = 0
  const imagenActual = todasLasImagenes[imgIndex] || todasLasImagenes[0]

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

  const totalStock = tallas.reduce((s, t) => s + t.stock, 0)

  return (
    <div className="producto-card">
      <div className="producto-img-wrap">
        <img src={imagenActual} alt={producto.nombre} />
        {producto.marca && (
          <span className="producto-marca-badge">{producto.marca}</span>
        )}
        {todasLasImagenes.length > 1 && (
          <>
            <button className="img-nav img-prev" onClick={(e) => { e.stopPropagation(); setImgIndex(i => (i - 1 + todasLasImagenes.length) % todasLasImagenes.length) }}>‹</button>
            <button className="img-nav img-next" onClick={(e) => { e.stopPropagation(); setImgIndex(i => (i + 1) % todasLasImagenes.length) }}>›</button>
            <div className="img-dots">
              {todasLasImagenes.map((_, i) => (
                <span key={i} className={`img-dot ${i === imgIndex ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); setImgIndex(i) }} />
              ))}
            </div>
          </>
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
