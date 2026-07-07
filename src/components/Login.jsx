import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login({ onCerrar }) {
  const { login, logout, user, esAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (user) {
    return (
      <div className="modal-overlay" onClick={onCerrar}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <div className="modal-header">
            <h2>Admin</h2>
            <button className="modal-cerrar" onClick={onCerrar}>✕</button>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem' }}>Conectado como:</p>
            <p style={{ fontWeight: 600, color: '#1a1a2e' }}>{user.email}</p>
            {esAdmin ? (
              <p style={{ color: '#22c55e', marginTop: '0.5rem' }}>✅ Admin verificado</p>
            ) : (
              <p style={{ color: '#e94560', marginTop: '0.5rem' }}>❌ No tienes permisos de admin</p>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              {esAdmin && <button className="btn-primary" onClick={onCerrar}>Ir al panel</button>}
              <button className="btn-vaciar" onClick={logout}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2>Iniciar Sesión</h2>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>
        <form onSubmit={handleLogin} style={{ padding: '2rem' }}>
          {error && (
            <p style={{ color: '#e94560', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.95rem' }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.95rem' }}
          />
          <button type="submit" className="btn-pagar" disabled={enviando} style={{ width: '100%' }}>
            {enviando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
