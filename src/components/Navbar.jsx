import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import UserMenu from './UserMenu'
import NotificacionesBell from './NotificacionesBell'
import SearchBar from './SearchBar'

export default function Navbar({
  onVerCarrito, onAdminClick, onVerPerfil, onVerPedidos,
  onCerrarSesion, onEliminarCuenta, onSearch,
  onVerFavoritos,
}) {
  const { cantidadTotal } = useCart()
  const { user, esAdmin } = useAuth()

  return (
    <header className="navbar">
      <div className="navbar-container">
        <h1 className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>
          Prada&apos;s
        </h1>

        <nav className="nav-links">
          <a href="#productos">Productos</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <div className="navbar-actions">
          <SearchBar onSearch={onSearch} />

          {esAdmin && (
            <button onClick={onAdminClick} className="btn-nav-link btn-admin-icon" title="Panel Admin">
              ⚙️
            </button>
          )}

          {user && (
            <>
              <button className="btn-nav-link" onClick={onVerFavoritos} title="Favoritos">
                ❤️
              </button>
              <NotificacionesBell />
            </>
          )}

          <div className="carrito-icono" onClick={onVerCarrito}>
            <span>🛒</span>
            {cantidadTotal > 0 && (
              <span className="carrito-contador">{cantidadTotal}</span>
            )}
          </div>

          {user ? (
            <UserMenu
              onVerPerfil={onVerPerfil}
              onVerPedidos={onVerPedidos}
              onCerrarSesion={onCerrarSesion}
              onEliminarCuenta={onEliminarCuenta}
            />
          ) : (
            <button className="btn-nav-link" onClick={() => onVerPerfil?.()}>👤 Ingresar</button>
          )}
        </div>
      </div>
    </header>
  )
}
