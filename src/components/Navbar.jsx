import { useCart } from '../context/CartContext'

export default function Navbar({ onVerCarrito, onAdminClick }) {
  const { cantidadTotal } = useCart()

  return (
    <header className="navbar">
      <div className="navbar-container">
        <h1 className="logo">Prada&apos;s</h1>
        <nav className="nav-links">
          <a href="#">Inicio</a>
          <a href="#productos">Productos</a>
          <a href="#ofertas">Ofertas</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={onAdminClick}
            className="btn-admin-nav"
            title="Administrar productos"
          >
            ⚙️
          </button>
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
