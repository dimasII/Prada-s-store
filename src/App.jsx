import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ProductCard from './components/ProductCard'
import Footer from './components/Footer'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import AdminDashboard from './admin/AdminDashboard'
import './App.css'

function App() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [verCarrito, setVerCarrito] = useState(false)
  const [verCheckout, setVerCheckout] = useState(false)
  const [verAdmin, setVerAdmin] = useState(false)
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('id', { ascending: false })

    if (!error && data) {
      setProductos(data)
    }
    setCargando(false)
  }

  return (
    <CartProvider>
      <div className="app">
        <Navbar
          onVerCarrito={() => setVerCarrito(true)}
          onAdminClick={() => setVerAdmin(true)}
        />

        <Hero />

        <section className="productos" id="productos">
          <h2 className="section-title">Productos Destacados</h2>
          {cargando ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando productos...</p>
          ) : productos.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>
              No hay productos disponibles. Agrega productos desde el panel de administración ⚙️
            </p>
          ) : (
            <div className="productos-grid">
              {productos.map(producto => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          )}
        </section>

        <Footer />

        {verCarrito && !verCheckout && !pedidoConfirmado && (
          <Cart
            onCerrar={() => setVerCarrito(false)}
            onCheckout={() => { setVerCheckout(true); setVerCarrito(false) }}
          />
        )}

        {verCheckout && !pedidoConfirmado && (
          <Checkout
            onCerrar={() => setVerCheckout(false)}
            onConfirmado={(pedido) => {
              setPedidoConfirmado(pedido)
              setVerCheckout(false)
            }}
          />
        )}

        {pedidoConfirmado && (
          <div className="modal-overlay" onClick={() => setPedidoConfirmado(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✅ Pedido Confirmado</h2>
              </div>
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                  ¡Gracias por tu compra!
                </p>
                <p>Número de pedido: <strong>#{pedidoConfirmado.id}</strong></p>
                <p style={{ color: '#666', marginTop: '1rem' }}>
                  Te enviaremos un email con los detalles del envío.
                </p>
                <button
                  className="btn-primary"
                  style={{ marginTop: '1.5rem' }}
                  onClick={() => setPedidoConfirmado(null)}
                >
                  Seguir comprando
                </button>
              </div>
            </div>
          </div>
        )}

        {verAdmin && (
          <AdminDashboard onCerrar={() => {
            setVerAdmin(false)
            cargarProductos()
          }} />
        )}
      </div>
    </CartProvider>
  )
}

export default App
