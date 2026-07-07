import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

export default function Checkout({ onCerrar, onConfirmado }) {
  const { carrito, total, vaciarCarrito } = useCart()
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
  })
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)

    try {
      const { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .insert({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
        })
        .select()
        .single()

      if (errCliente) throw errCliente

      const { data: pedido, error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: cliente.id,
          total,
          direccion_envio: formData.direccion,
          metodo_pago: 'pendiente',
        })
        .select()
        .single()

      if (errPedido) throw errPedido

      const items = carrito.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      }))

      const { error: errItems } = await supabase
        .from('pedido_items')
        .insert(items)

      if (errItems) throw errItems

      vaciarCarrito()
      onConfirmado(pedido)
    } catch (error) {
      alert('Error al procesar el pedido: ' + error.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content modal-checkout" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Finalizar Pedido</h2>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-resumen">
            <h3>Resumen del pedido</h3>
            {carrito.map(item => (
              <div key={item.id} className="checkout-item">
                <span>{item.nombre} x{item.cantidad}</span>
                <span>${(item.precio * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
            <div className="checkout-total">
              <strong>Total:</strong>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </div>

          <div className="checkout-datos">
            <h3>Datos de envío</h3>
            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              required
            />
            <textarea
              placeholder="Dirección de envío"
              value={formData.direccion}
              onChange={e => setFormData({ ...formData, direccion: e.target.value })}
              required
              rows={3}
            />
          </div>

          <button type="submit" className="btn-pagar" disabled={enviando}>
            {enviando ? 'Procesando...' : `Confirmar pedido - $${total.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  )
}
