import { useCart } from '../context/CartContext'

export default function ProductCard({ producto, onVerDetalle }) {
  const { agregarAlCarrito } = useCart()

  const imagenSrc = producto.imagen_url
    ? producto.imagen_url
    : `https://placehold.co/300x400/e2e8f0/64748b?text=${encodeURIComponent(producto.nombre)}`

  return (
    <div className="producto-card" onClick={() => onVerDetalle?.(producto)}>
      <img src={imagenSrc} alt={producto.nombre} />
      <div className="producto-info">
        <h3>{producto.nombre}</h3>
        <p className="producto-precio">${Number(producto.precio).toFixed(2)}</p>
        {producto.stock > 0 ? (
          <button
            className="btn-agregar"
            onClick={(e) => {
              e.stopPropagation()
              agregarAlCarrito(producto)
            }}
          >
            Agregar al carrito
          </button>
        ) : (
          <button className="btn-agregar" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            Agotado
          </button>
        )}
      </div>
    </div>
  )
}
