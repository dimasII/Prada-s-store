import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function NotificacionesBell() {
  const { perfil } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!perfil) return
    cargarNotificaciones()
    const interval = setInterval(cargarNotificaciones, 30000)
    return () => clearInterval(interval)
  }, [perfil])

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const cargarNotificaciones = async () => {
    if (!perfil) return
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('cliente_id', perfil.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotificaciones(data)
  }

  const marcarLeida = async (id) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  const noLeidas = notificaciones.filter(n => !n.leida).length

  return (
    <div className="notif-bell" ref={ref}>
      <button className="btn-nav-link" onClick={() => setAbierto(!abierto)}>
        🔔 {noLeidas > 0 && <span className="notif-count">{noLeidas}</span>}
      </button>
      {abierto && (
        <div className="notif-dropdown">
          <div className="dropdown-header"><strong>Notificaciones</strong></div>
          {notificaciones.length === 0 ? (
            <p style={{ padding: '1rem', color: '#888', fontSize: '0.85rem', textAlign: 'center' }}>Sin notificaciones</p>
          ) : (
            notificaciones.map(n => (
              <div key={n.id} className={`notif-item ${n.leida ? '' : 'no-leida'}`} onClick={() => !n.leida && marcarLeida(n.id)}>
                <div className="notif-item-titulo">{n.titulo}</div>
                {n.mensaje && <div className="notif-item-msg">{n.mensaje}</div>}
                <div className="notif-item-fecha">{new Date(n.created_at).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
