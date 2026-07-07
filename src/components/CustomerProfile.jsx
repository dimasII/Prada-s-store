import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function CustomerProfile({ onCerrar, onVerPedidos }) {
  const { perfil, actualizarPerfil, logout } = useAuth()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ ...perfil })
  const [mensaje, setMensaje] = useState('')

  const handleGuardar = async (e) => {
    e.preventDefault()
    try {
      await actualizarPerfil({
        nombre: form.nombre,
        telefono: form.telefono,
        direccion: form.direccion,
        ciudad: form.ciudad,
        codigo_postal: form.codigo_postal,
      })
      setMensaje('✅ Datos actualizados')
      setEditando(false)
      setTimeout(() => setMensaje(''), 3000)
    } catch {
      setMensaje('❌ Error al guardar')
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2>Mi Cuenta</h2>
          <button className="modal-cerrar" onClick={onCerrar}>✕</button>
        </div>
        <div style={{ padding: '2rem' }}>
          {mensaje && (
            <p style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: 6, marginBottom: '1rem', textAlign: 'center' }}>
              {mensaje}
            </p>
          )}
          <form onSubmit={handleGuardar}>
            <input type="text" placeholder="Nombre completo"
              value={editando ? form.nombre : (perfil?.nombre || '')}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              disabled={!editando}
              style={inputStyle(!editando)} required />
            <input type="email" placeholder="Email" value={perfil?.email || ''} disabled style={inputStyle(true)} />
            <input type="tel" placeholder="Teléfono"
              value={editando ? form.telefono : (perfil?.telefono || '')}
              onChange={e => setForm({ ...form, telefono: e.target.value })}
              disabled={!editando}
              style={inputStyle(!editando)} required />
            <input type="text" placeholder="Dirección"
              value={editando ? form.direccion : (perfil?.direccion || '')}
              onChange={e => setForm({ ...form, direccion: e.target.value })}
              disabled={!editando}
              style={inputStyle(!editando)} required />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <input type="text" placeholder="Ciudad"
                value={editando ? form.ciudad : (perfil?.ciudad || '')}
                onChange={e => setForm({ ...form, ciudad: e.target.value })}
                disabled={!editando}
                style={inputStyle(!editando)} required />
              <input type="text" placeholder="CP"
                value={editando ? form.codigo_postal : (perfil?.codigo_postal || '')}
                onChange={e => setForm({ ...form, codigo_postal: e.target.value })}
                disabled={!editando}
                style={inputStyle(!editando)} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              {editando ? (
                <>
                  <button type="submit" className="btn-pagar">Guardar</button>
                  <button type="button" className="btn-vaciar" onClick={() => setEditando(false)}>Cancelar</button>
                </>
              ) : (
                <button type="button" className="btn-primary" onClick={() => setEditando(true)}>Editar datos</button>
              )}
            </div>
          </form>
          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #eee' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn-vaciar" onClick={onVerPedidos} style={{ width: '100%', textAlign: 'center' }}>
              📦 Ver mis compras
            </button>
            <button className="btn-vaciar" onClick={logout} style={{ width: '100%', textAlign: 'center', color: '#e94560' }}>
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = (disabled) => ({
  width: '100%', padding: '0.75rem', marginBottom: '0.75rem',
  border: disabled ? '1px solid #eee' : '1px solid #ddd',
  borderRadius: 6, fontSize: '0.95rem', fontFamily: 'inherit',
  background: disabled ? '#f9f9f9' : 'white',
  color: disabled ? '#888' : '#1a1a2e',
})
