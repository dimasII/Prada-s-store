import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ onVerCarrito, onAdminClick, onMiCuenta }) {
  const { cantidadTotal } = useCart()
  const { user, perfil, esAdmin } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-container">
        <h1 className="logo">Prada&apos;s</h1>
        <nav className="nav-links">
          <a href="#">Inicio</a>
          <a href="#productos">Productos</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <div className="navbar-actions">
          {user ? (
            <button className={`btn-nav-link ${esAdmin ? 'btn-admin' : ''}`} onClick={onMiCuenta}>
              👤 {perfil?.nombre?.split(' ')[0] || user.email?.split('@')[0] || 'Cuenta'}
              {esAdmin ? ' 👑' : ' 🛒'}
            </button>
          ) : (
            <button className="btn-nav-link" onClick={onMiCuenta}>👤 Ingresar</button>
          )}
          {esAdmin && (
            <button onClick={onAdminClick} className="btn-nav-link btn-admin-icon" title="Panel Admin">
              ⚙️
            </button>
          )}
          <div className="carrito-icono" onClick={onVerCarrito}>
            <span>🛒</span>
            {cantidadTotal > 0 && (
              <span className="carrito-contador">{cantidadTotal}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
