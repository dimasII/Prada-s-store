import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function CustomerAuth({ onCerrar, onLoginExitoso }) {
  const { login, registrar } = useAuth()
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [datos, setDatos] = useState({ nombre: '', telefono: '', direccion: '', ciudad: '', codigo_postal: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [registroExitoso, setRegistroExitoso] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await login(email, password)
      onLoginExitoso?.()
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : 'Error al iniciar sesión')
    } finally {
      setEnviando(false)
    }
  }

  const handleRegistro = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setEnviando(true)
    try {
      await registrar(email, password, datos)
      setRegistroExitoso(true)
    } catch (err) {
      setError(err.message === 'User already registered'
        ? 'Este email ya está registrado'
        : err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2>{modo === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>

        {registroExitoso ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>✅ Cuenta creada</p>
            <p style={{ color: '#666' }}>Revisa tu email para confirmar la cuenta. Luego inicia sesión.</p>
            <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => { setModo('login'); setRegistroExitoso(false) }}>
              Iniciar Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={modo === 'login' ? handleLogin : handleRegistro} style={{ padding: '2rem' }}>
            {error && <p style={{ color: '#e94560', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              style={inputStyle} />
            <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required
              style={inputStyle} />

            {modo === 'register' && (
              <>
                <input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  style={inputStyle} />
                <input type="text" placeholder="Nombre completo" value={datos.nombre} onChange={e => setDatos({ ...datos, nombre: e.target.value })} required
                  style={inputStyle} />
                <input type="tel" placeholder="Teléfono" value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} required
                  style={inputStyle} />
                <input type="text" placeholder="Dirección" value={datos.direccion} onChange={e => setDatos({ ...datos, direccion: e.target.value })} required
                  style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <input type="text" placeholder="Ciudad" value={datos.ciudad} onChange={e => setDatos({ ...datos, ciudad: e.target.value })} required
                    style={inputStyle} />
                  <input type="text" placeholder="Código postal" value={datos.codigo_postal} onChange={e => setDatos({ ...datos, codigo_postal: e.target.value })}
                    style={inputStyle} />
                </div>
              </>
            )}

            <button type="submit" className="btn-pagar" disabled={enviando} style={{ width: '100%', marginTop: '0.5rem' }}>
              {enviando ? 'Procesando...' : modo === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              {modo === 'login' ? (
                <>¿No tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setModo('register'); setError('') }} style={{ color: '#e94560' }}>Regístrate</a></>
              ) : (
                <>¿Ya tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setModo('login'); setError('') }} style={{ color: '#e94560' }}>Inicia sesión</a></>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '0.75rem', marginBottom: '0.75rem',
  border: '1px solid #ddd', borderRadius: 6, fontSize: '0.95rem', fontFamily: 'inherit'
}
