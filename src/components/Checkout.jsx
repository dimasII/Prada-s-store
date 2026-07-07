import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Checkout({ onCerrar, onConfirmado }) {
  const { carrito, total, vaciarCarrito } = useCart()
  const { perfil } = useAuth()
  const [enviando, setEnviando] = useState(false)
  const [costoEnvio] = useState(total >= 100 ? 0 : 9.99)
  const totalFinal = total + costoEnvio

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)

    try {
      const { data: pedido, error: errPedido } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: perfil.id,
          total: totalFinal,
          costo_envio: costoEnvio,
          direccion_envio: perfil.direccion,
          ciudad_envio: perfil.ciudad,
        })
        .select()
        .single()

      if (errPedido) throw errPedido

      const items = carrito.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.id,
        talla: item.talla,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      }))

      const { error: errItems } = await supabase
        .from('pedido_items')
        .insert(items)

      if (errItems) throw errItems

      const { error: errPago } = await supabase
        .from('pagos')
        .insert({
          pedido_id: pedido.id,
          monto: totalFinal,
        })

      if (errPago) throw errPago

      // Crear preferencia en Mercado Pago
      const mpRes = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: carrito.map(item => ({
            nombre: `${item.nombre} - Talla ${item.talla}`,
            cantidad: item.cantidad,
            precio: item.precio,
          })),
          pedidoId: pedido.id,
          clienteEmail: perfil.email,
          clienteNombre: perfil.nombre,
        }),
      })

      if (!mpRes.ok) {
        // Sin Mercado Pago, confirmar igual
        vaciarCarrito()
        onConfirmado(pedido)
        return
      }

      const mpData = await mpRes.json()

      // Guardar referencia de MP
      await supabase.from('pagos').update({
        mp_preference_id: mpData.id,
      }).eq('pedido_id', pedido.id)

      vaciarCarrito()

      // Redirigir a Mercado Pago
      if (mpData.init_point) {
        window.location.href = mpData.init_point
      } else {
        onConfirmado(pedido)
      }
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
              <div key={item.key} className="checkout-item">
                <span>{item.nombre} (Talla {item.talla}) x{item.cantidad}</span>
                <span>${(item.precio * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
            <div className="checkout-item">
              <span>Envío</span>
              <span>{costoEnvio === 0 ? 'Gratis' : `$${costoEnvio.toFixed(2)}`}</span>
            </div>
            {costoEnvio > 0 && (
              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                🚚 Envío gratis en compras mayores a $100
              </p>
            )}
            <div className="checkout-total">
              <strong>Total:</strong>
              <strong>${totalFinal.toFixed(2)}</strong>
            </div>
          </div>

          <div className="checkout-datos">
            <h3>Datos de envío</h3>
            <p><strong>Nombre:</strong> {perfil?.nombre}</p>
            <p><strong>Email:</strong> {perfil?.email}</p>
            <p><strong>Teléfono:</strong> {perfil?.telefono}</p>
            <p><strong>Dirección:</strong> {perfil?.direccion}</p>
            <p><strong>Ciudad:</strong> {perfil?.ciudad} {perfil?.codigo_postal && `(${perfil.codigo_postal})`}</p>
          </div>

          <div className="checkout-pago">
            <h3>Método de pago</h3>
            <div className="mp-badge">
              <span>💳 Pagar con Mercado Pago</span>
            </div>
          </div>

          <button type="submit" className="btn-pagar btn-pagar-full" disabled={enviando}>
            {enviando ? 'Procesando...' : `Pagar $${totalFinal.toFixed(2)} con Mercado Pago`}
          </button>
        </form>
      </div>
    </div>
  )
}
