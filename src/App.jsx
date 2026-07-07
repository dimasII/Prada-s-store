import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { CartProvider } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ProductCard from './components/ProductCard'
import Footer from './components/Footer'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Login from './components/Login'
import AdminDashboard from './admin/AdminDashboard'
import './App.css'

function AppContent() {
  const { user, esAdmin, cargando } = useAuth()
  const [productos, setProductos] = useState([])
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [verCarrito, setVerCarrito] = useState(false)
  const [verCheckout, setVerCheckout] = useState(false)
  const [verLogin, setVerLogin] = useState(false)
  const [verAdmin, setVerAdmin] = useState(false)
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    setCargandoProductos(true)
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('id', { ascending: false })

    if (data) setProductos(data)
    setCargandoProductos(false)
  }

  const handleAdminClick = () => {
    if (user && esAdmin) {
      setVerAdmin(true)
    } else {
      setVerLogin(true)
    }
  }

  return (
    <div className="app">
      <Navbar
        onVerCarrito={() => setVerCarrito(true)}
        onAdminClick={handleAdminClick}
      />

      <Hero />

      <section className="productos" id="productos">
        <h2 className="section-title">Productos Destacados</h2>
        {cargandoProductos ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>
            No hay productos disponibles. El admin puede agregarlos desde ⚙️
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

      {verLogin && (
        <Login onCerrar={() => {
          setVerLogin(false)
          setVerAdmin(true)
        }} />
      )}

      {verAdmin && esAdmin && !verCarrito && (
        <AdminDashboard onCerrar={() => {
          setVerAdmin(false)
          cargarProductos()
        }} />
      )}

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
              <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setPedidoConfirmado(null)}>
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
