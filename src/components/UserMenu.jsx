import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function UserMenu({ onVerPerfil, onVerPedidos, onCerrarSesion, onEliminarCuenta }) {
  const { perfil, esAdmin } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="user-menu" ref={ref}>
      <button className="btn-nav-link" onClick={() => setAbierto(!abierto)}>
        👤 {perfil?.nombre?.split(' ')[0] || 'Cuenta'} {esAdmin ? '👑' : '🛒'} ▾
      </button>
      {abierto && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <strong>{perfil?.nombre || 'Usuario'}</strong>
            <small>{perfil?.email}</small>
            {esAdmin && <span className="dropdown-badge">Admin</span>}
          </div>
          <button onClick={() => { setAbierto(false); onVerPerfil?.() }}>👤 Mis datos</button>
          <button onClick={() => { setAbierto(false); onVerPedidos?.() }}>📦 Mis compras</button>
          <hr />
          <button className="dropdown-danger" onClick={() => { setAbierto(false); onCerrarSesion?.() }}>🚪 Cerrar sesión</button>
          <button className="dropdown-danger" onClick={() => { setAbierto(false); onEliminarCuenta?.() }}>🗑️ Eliminar cuenta</button>
        </div>
      )}
    </div>
  )
}
