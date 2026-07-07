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
import CustomerAuth from './components/CustomerAuth'
import CustomerProfile from './components/CustomerProfile'
import AdminLogin from './components/Login'
import AdminDashboard from './admin/AdminDashboard'
import './App.css'

function AppContent() {
  const { user, esAdmin, cargando } = useAuth()
  const [productos, setProductos] = useState([])
  const [tallas, setTallas] = useState({})
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [verCarrito, setVerCarrito] = useState(false)
  const [verCheckout, setVerCheckout] = useState(false)
  const [verCustomerAuth, setVerCustomerAuth] = useState(false)
  const [verPerfil, setVerPerfil] = useState(false)
  const [verAdminLogin, setVerAdminLogin] = useState(false)
  const [verAdmin, setVerAdmin] = useState(false)
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null)
  const [verPedidos, setVerPedidos] = useState(false)
  const [misPedidos, setMisPedidos] = useState([])
  const [pagoInfo, setPagoInfo] = useState(null)

  useEffect(() => {
    cargarProductos()
    // Check for payment redirect
    const params = new URLSearchParams(window.location.search)
    const pedidoId = params.get('pedido_id')
    const status = window.location.pathname
    if (pedidoId && status.includes('pago-exitoso')) {
      setPagoInfo({ tipo: 'exitoso', pedidoId })
      window.history.replaceState({}, '', '/')
    } else if (pedidoId && status.includes('pago-fallido')) {
      setPagoInfo({ tipo: 'fallido', pedidoId })
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const cargarProductos = async () => {
    setCargandoProductos(true)
    const { data } = await supabase
      .from('productos')
      .select('*, marcas(nombre)')
      .eq('activo', true)
      .order('id', { ascending: false })
    if (data) {
      setProductos(data)
      data.forEach(p => cargarTallas(p.id))
    }
    setCargandoProductos(false)
  }

  const cargarTallas = async (productoId) => {
    const { data } = await supabase
      .from('producto_tallas')
      .select('*')
      .eq('producto_id', productoId)
      .order('talla')
    if (data) {
      setTallas(prev => ({ ...prev, [productoId]: data }))
    }
  }

  const handleMiCuenta = () => {
    if (user) {
      setVerPerfil(true)
    } else {
      setVerCustomerAuth(true)
    }
  }

  const cargarPedidos = async () => {
    if (!user) return
    const { data } = await supabase
      .from('pedidos')
      .select('*, pedido_items(*, productos(nombre))')
      .eq('cliente_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setMisPedidos(data)
  }

  return (
    <div className="app">
      <Navbar
        onVerCarrito={() => setVerCarrito(true)}
        onAdminClick={() => user && esAdmin ? setVerAdmin(true) : setVerAdminLogin(true)}
        onMiCuenta={handleMiCuenta}
      />

      <Hero />

      {pagoInfo && (
        <div className="pago-banner" onClick={() => setPagoInfo(null)}>
          {pagoInfo.tipo === 'exitoso'
            ? '✅ Pago aprobado. Gracias por tu compra.'
            : '❌ El pago no pudo completarse. Intenta de nuevo.'}
        </div>
      )}

      <section className="productos" id="productos">
        <h2 className="section-title">Productos Destacados</h2>
        {cargandoProductos ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>
            No hay productos disponibles.
          </p>
        ) : (
          <div className="productos-grid">
            {productos.map(producto => (
              <ProductCard
                key={producto.id}
                producto={producto}
                tallas={tallas[producto.id] || []}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />

      {verCustomerAuth && (
        <CustomerAuth
          onCerrar={() => setVerCustomerAuth(false)}
          onLoginExitoso={() => { setVerCustomerAuth(false); setVerPerfil(true) }}
        />
      )}

      {verPerfil && (
        <CustomerProfile
          onCerrar={() => setVerPerfil(false)}
          onVerPedidos={() => { cargarPedidos(); setVerPedidos(true); setVerPerfil(false) }}
        />
      )}

      {verPedidos && (
        <div className="modal-overlay" onClick={() => setVerPedidos(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>Mis Pedidos</h2>
              <button className="modal-cerrar" onClick={() => setVerPedidos(false)}>✕</button>
            </div>
            <div style={{ padding: '2rem' }}>
              {misPedidos.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center' }}>No tienes pedidos aún</p>
              ) : (
                misPedidos.map(p => (
                  <div key={p.id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: 8, marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>Pedido #{p.id}</strong>
                      <span className={`estado-badge estado-${p.estado}`}>{p.estado}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>{new Date(p.created_at).toLocaleDateString()}</p>
                    <p style={{ fontSize: '0.9rem' }}>Total: <strong>${Number(p.total).toFixed(2)}</strong></p>
                    <p style={{ fontSize: '0.85rem', color: '#888' }}>Envío a: {p.direccion_envio}, {p.ciudad_envio}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {verAdminLogin && (
        <AdminLogin onCerrar={() => {
          setVerAdminLogin(false)
          if (user && esAdmin) setVerAdmin(true)
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
              <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>¡Gracias por tu compra!</p>
              <p>Número de pedido: <strong>#{pedidoConfirmado.id}</strong></p>
              <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Serás redirigido a Mercado Pago para completar el pago.
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
