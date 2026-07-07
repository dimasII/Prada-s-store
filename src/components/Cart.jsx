import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

export default function Cart({ onCerrar, onCheckout }) {
  const { carrito, eliminarDelCarrito, actualizarCantidad, total, vaciarCarrito } = useCart()

  if (carrito.length === 0) {
    return (
      <div className="modal-overlay" onClick={onCerrar}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Carrito de Compras</h2>
            <button className="modal-cerrar" onClick={onCerrar}>✕</button>
          </div>
          <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Tu carrito está vacío
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content modal-carrito" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Carrito de Compras</h2>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <div className="carrito-items">
          {carrito.map(item => (
            <div key={item.id} className="carrito-item">
              <img
                src={item.imagen_url || `https://placehold.co/80x80/e2e8f0/64748b?text=${encodeURIComponent(item.nombre)}`}
                alt={item.nombre}
                className="carrito-item-img"
              />
              <div className="carrito-item-info">
                <h4>{item.nombre}</h4>
                <p>${Number(item.precio).toFixed(2)}</p>
              </div>
              <div className="carrito-item-cantidad">
                <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}>-</button>
                <span>{item.cantidad}</span>
                <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}>+</button>
              </div>
              <button className="carrito-item-eliminar" onClick={() => eliminarDelCarrito(item.id)}>
                🗑️
              </button>
            </div>
          ))}
        </div>

        <div className="carrito-footer">
          <div className="carrito-total">
            <span>Total:</span>
            <strong>${total.toFixed(2)}</strong>
          </div>
          <div className="carrito-acciones">
            <button className="btn-vaciar" onClick={vaciarCarrito}>Vaciar carrito</button>
            <button className="btn-pagar" onClick={onCheckout}>Proceder al pago</button>
          </div>
        </div>
      </div>
    </div>
  )
}
