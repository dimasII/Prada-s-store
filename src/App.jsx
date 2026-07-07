import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { CartProvider } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FavoritosProvider } from './context/FavoritosContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HeroSecciones from './components/HeroSecciones'
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
  const { user, esAdmin, cargando, logout } = useAuth()
  const [productos, setProductos] = useState([])
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [tallas, setTallas] = useState({})
  const [imagenes, setImagenes] = useState({})
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
  const [filtroGenero, setFiltroGenero] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarProductos()
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

  useEffect(() => {
    let filtrados = [...productos]
    if (filtroGenero) {
      filtrados = filtrados.filter(p => p.genero === filtroGenero)
    }
    if (busqueda) {
      const q = busqueda.toLowerCase()
      filtrados = filtrados.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.marcas?.nombre?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q)
      )
    }
    setProductosFiltrados(filtrados)
  }, [productos, filtroGenero, busqueda])

  const cargarProductos = async () => {
    setCargandoProductos(true)
    const { data } = await supabase
      .from('productos')
      .select('*, marcas(nombre)')
      .eq('activo', true)
      .order('id', { ascending: false })
    if (data) {
      setProductos(data)
      data.forEach(p => { cargarTallas(p.id); cargarImagenes(p.id) })
    }
    setCargandoProductos(false)
  }

  const cargarTallas = async (productoId) => {
    const { data } = await supabase
      .from('producto_tallas')
      .select('*')
      .eq('producto_id', productoId)
      .order('talla')
    if (data) setTallas(prev => ({ ...prev, [productoId]: data }))
  }

  const cargarImagenes = async (productoId) => {
    const { data } = await supabase
      .from('producto_imagenes')
      .select('*')
      .eq('producto_id', productoId)
      .order('orden')
    if (data) setImagenes(prev => ({ ...prev, [productoId]: data }))
  }

  const handleMiCuenta = () => {
    if (user) setVerPerfil(true)
    else setVerCustomerAuth(true)
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

  const handleEliminarCuenta = async () => {
    if (!confirm('¿Estás seguro? Se eliminarán todos tus datos.')) return
    if (!confirm('Esta acción no se puede deshacer. ¿Continuar?')) return
    try {
      await supabase.auth.admin.deleteUser(user.id)
    } catch {
      alert('No se pudo eliminar la cuenta. Contacta al administrador.')
    }
  }

  const handleSeccionClick = (slug) => {
    if (slug.includes('mujer')) setFiltroGenero('mujer')
    else if (slug.includes('hombre') || slug.includes('varon')) setFiltroGenero('varon')
    else setFiltroGenero(null)
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (cargando) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Cargando...</div>
  }

  return (
    <div className="app">
      <Navbar
        onVerCarrito={() => setVerCarrito(true)}
        onAdminClick={() => user && esAdmin ? setVerAdmin(true) : setVerAdminLogin(true)}
        onVerPerfil={handleMiCuenta}
        onVerPedidos={() => { cargarPedidos(); setVerPedidos(true); setVerPerfil(false) }}
        onCerrarSesion={logout}
        onEliminarCuenta={handleEliminarCuenta}
        onSearch={(q) => setBusqueda(q)}
      />

      {!filtroGenero && !busqueda && <Hero />}
      <HeroSecciones onSeccionClick={handleSeccionClick} />

      {pagoInfo && (
        <div className="pago-banner" onClick={() => setPagoInfo(null)}>
          {pagoInfo.tipo === 'exitoso'
            ? '✅ Pago aprobado. Gracias por tu compra.'
            : '❌ El pago no pudo completarse.'}
        </div>
      )}

      {(filtroGenero || busqueda) && (
        <div className="filtro-barra">
          <span>
            {filtroGenero && `Mostrando: ${filtroGenero === 'varon' ? '👨 Varón' : '👩 Mujer'}`}
            {busqueda && ` Buscando: "${busqueda}"`}
          </span>
          <button className="btn-clear-filtro" onClick={() => { setFiltroGenero(null); setBusqueda('') }}>✕ Limpiar</button>
        </div>
      )}

      <section className="productos" id="productos">
        <h2 className="section-title">
          {filtroGenero === 'varon' ? 'Zapatillas de Hombre' :
           filtroGenero === 'mujer' ? 'Zapatillas de Mujer' :
           busqueda ? 'Resultados de búsqueda' :
           'Productos Destacados'}
        </h2>
        {cargandoProductos ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando productos...</p>
        ) : productosFiltrados.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>
            {busqueda ? 'No se encontraron productos con esa búsqueda.' : 'No hay productos disponibles.'}
          </p>
        ) : (
          <div className="productos-grid">
            {productosFiltrados.map(producto => (
              <ProductCard
                key={producto.id}
                producto={producto}
                tallas={tallas[producto.id] || []}
                imagenes={imagenes[producto.id] || []}
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
              <h2>Mis Compras</h2>
              <button className="modal-cerrar" onClick={() => setVerPedidos(false)}>✕</button>
            </div>
            <div style={{ padding: '2rem' }}>
              {misPedidos.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center' }}>No tienes compras aún</p>
              ) : (
                misPedidos.map(p => (
                  <div key={p.id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: 8, marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>Pedido #{p.id}</strong>
                      <span className={`estado-badge estado-${p.estado}`}>{p.estado}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>{new Date(p.created_at).toLocaleDateString()}</p>
                    <p style={{ fontSize: '0.9rem' }}>Total: <strong>${Number(p.total).toFixed(2)}</strong></p>
                    <p style={{ fontSize: '0.85rem', color: '#888' }}>
                      Envío a: {p.direccion_envio}, {p.ciudad_envio}
                    </p>
                    {p.estado === 'enviado' && (
                      <p style={{ fontSize: '0.85rem', color: '#2563eb', marginTop: '0.25rem' }}>
                        🚚 Número de seguimiento: PRADA-{String(p.id).padStart(6, '0')}
                      </p>
                    )}
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
        <FavoritosProvider>
          <AppContent />
        </FavoritosProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
